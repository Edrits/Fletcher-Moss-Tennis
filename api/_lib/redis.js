// Thin Upstash Redis REST client, plus the one Lua script that makes signing up safe.
//
// Why Redis at all: sign-up opens at a set time and thirty people tap at once. The repo
// cannot absorb that. GitHub accepts one PUT per file version, so thirty writers means one
// winner and twenty-nine conflicts, then twenty-eight, and so on: roughly 450 write
// attempts to seat thirty people, each a full round trip, plus a redeploy per commit.
// A Redis list append is atomic and returns the new length, so the same burst is thirty
// ordinary appends.
//
// Credentials come from the Vercel marketplace integration, which does not use one fixed
// pair of names: it has shipped both KV_* and UPSTASH_* spellings, and when the store is
// given a name it prefixes them with it (a store called "signups" yields
// SIGNUPS_KV_REST_API_URL). Rather than guess through a series of failed deploys, find any
// matching pair. Exported and pure so it can be tested against fake environments.
export function pickCredentials(env = {}) {
  const preferred = [
    ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
    ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']
  ];
  for (const [u, t] of preferred) {
    if (env[u] && env[t]) return { url: env[u], token: env[t], via: u };
  }
  // Fall back to any "<PREFIX>REST_API_URL" / "<PREFIX>REST_URL" that has a sibling token.
  for (const key of Object.keys(env)) {
    const m = key.match(/^(.*?)(REST_API_URL|REST_URL)$/);
    if (!m || !env[key]) continue;
    const tokenKey = [`${m[1]}REST_API_TOKEN`, `${m[1]}REST_TOKEN`, `${m[1]}TOKEN`]
      .find(k => env[k]);
    if (tokenKey) return { url: env[key], token: env[tokenKey], via: key };
  }
  return { url: null, token: null, via: null };
}

// Names only, never values. Used to make a misconfiguration diagnosable without printing
// a credential into a log.
export function describeCredentialEnv(env = {}) {
  return Object.keys(env)
    .filter(k => /REDIS|UPSTASH|KV_|REST_API/.test(k))
    .sort();
}

// Guarded so the browser test harness can import the two pure helpers above. There is no
// `process` in a browser, and an unguarded read would throw while the module is still
// evaluating, taking the whole harness down with it.
const ENV = typeof process !== 'undefined' && process.env ? process.env : {};
const { url: REST_URL, token: REST_TOKEN } = pickCredentials(ENV);

export const KEYS = {
  meta: 'fm:signup:meta',
  queue: 'fm:signup:queue'
};

export function isConfigured() {
  return Boolean(REST_URL && REST_TOKEN);
}

// Upstash takes a command as a JSON array, e.g. ["HGETALL","fm:signup:meta"].
export async function command(parts) {
  if (!isConfigured()) {
    throw new Error('Redis is not configured on this deployment');
  }
  const res = await fetch(REST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(parts.map(String))
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    throw new Error(body.error || `Redis command failed with ${res.status}`);
  }
  return body.result;
}

export async function hgetall(key) {
  const flat = await command(['HGETALL', key]);
  if (!Array.isArray(flat)) return {};
  const out = {};
  for (let i = 0; i < flat.length; i += 2) out[flat[i]] = flat[i + 1];
  return out;
}

export async function hset(key, obj) {
  const parts = ['HSET', key];
  for (const [k, v] of Object.entries(obj)) {
    parts.push(k, typeof v === 'string' ? v : JSON.stringify(v));
  }
  return command(parts);
}

export async function lrangeJSON(key) {
  const raw = await command(['LRANGE', key, 0, -1]);
  if (!Array.isArray(raw)) return [];
  return raw
    .map(item => {
      try { return JSON.parse(item); } catch { return null; }
    })
    .filter(Boolean);
}

export async function del(...keys) {
  return command(['DEL', ...keys]);
}

// Everything that must not interleave happens inside this script, so the whole check-then
// -append is one atomic step:
//   1. reject a token that already holds a place
//   2. reject once the list is full, waiting list included
//   3. resolve a display-name clash to "John S.2" against the live list
//   4. append and report the position
//
// Step 3 has to be in here rather than in JavaScript. Reading the list, picking a free
// name and then pushing would let two people racing with the same shortened name both see
// it as free and both take it. Duplicate names would then corrupt the pairings tool, which
// matches players by name string.
// Clash detection compares a `key` field rather than lower-casing inside the script. Lua's
// string.lower is byte-wise and leaves multi-byte UTF-8 untouched, so "Renée D." and
// "RENÉE D." would not match there even though JavaScript considers them the same name.
// The caller supplies an already-lower-cased key and the script only ever concatenates a
// digit onto it, which keeps the comparison Unicode-correct.
export const JOIN_SCRIPT = `
local queue   = KEYS[1]
local token   = ARGV[1]
local base    = ARGV[2]
local limit   = tonumber(ARGV[3])
local at      = ARGV[4]
local baseKey = ARGV[5]

local items = redis.call('LRANGE', queue, 0, -1)
local keys = {}
for i = 1, #items do
  local ok, entry = pcall(cjson.decode, items[i])
  if ok and entry then
    if entry.token == token then
      return cjson.encode({ error = 'already_in' })
    end
    if entry.key then
      keys[entry.key] = true
    elseif entry.name then
      keys[string.lower(entry.name)] = true
    end
  end
end

if #items >= limit then
  return cjson.encode({ error = 'full' })
end

local candidate = base
local candKey   = baseKey
local n = 1
while keys[candKey] do
  n = n + 1
  candidate = base .. n
  candKey   = baseKey .. n
end

redis.call('RPUSH', queue, cjson.encode({ name = candidate, key = candKey, token = token, at = at }))
return cjson.encode({ position = #items + 1, name = candidate })
`;

export async function joinAtomic({ token, displayBase, limit, at }) {
  const raw = await command([
    'EVAL', JOIN_SCRIPT, 1, KEYS.queue,
    token, displayBase, limit, at, displayBase.toLowerCase()
  ]);
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Unexpected response from the sign-up script');
  }
}

// Removing by NAME, not by position.
//
// Positions shift the instant anybody else leaves, so an admin screen that is even a few
// seconds stale would take off the wrong person. Display names are unique by construction,
// because the join script disambiguates clashes, which makes them a safe key.
//
// Removing by exact stored value is also what produces the cascade: LREM shifts everything
// below up by one, so sub 1 becomes main 16 with no separate promotion step.
export async function removeByNames(names) {
  const wanted = new Set((names || []).map(n => String(n).trim().toLowerCase()).filter(Boolean));
  if (!wanted.size) return { removed: [], missing: [] };

  const items = await command(['LRANGE', KEYS.queue, 0, -1]);
  if (!Array.isArray(items)) return { removed: [], missing: [...wanted] };

  const removed = [];
  for (const raw of items) {
    let entry;
    try { entry = JSON.parse(raw); } catch { continue; }
    const key = String(entry.key || entry.name || '').toLowerCase();
    if (wanted.has(key)) {
      await command(['LREM', KEYS.queue, 1, raw]);
      removed.push(entry.name);
      wanted.delete(key);
    }
  }
  return { removed, missing: [...wanted] };
}

// Crude per-caller throttle. The endpoint is public and unauthenticated, so without this
// one script can take all 28 places in a couple of seconds at opening time, before any
// member's thumb lands. INCR then EXPIRE on first hit keeps it to two commands.
//
// Keyed on the forwarded client IP. Several members on the same home wifi or on mobile
// carrier NAT share an address, so the limit has to be loose enough not to catch a couple
// of housemates signing up together.
export async function hitRateLimit(bucket, id, limit, windowSeconds) {
  const key = `fm:rate:${bucket}:${id}`;
  const count = Number(await command(['INCR', key]));
  if (count === 1) await command(['EXPIRE', key, windowSeconds]);
  return { allowed: count <= limit, count };
}

export async function removeByToken(token) {
  const items = await command(['LRANGE', KEYS.queue, 0, -1]);
  if (!Array.isArray(items)) return { error: 'Nothing to cancel.' };
  const match = items.find(raw => {
    try { return JSON.parse(raw).token === token; } catch { return false; }
  });
  if (!match) return { error: 'No sign-up found on this device.' };
  await command(['LREM', KEYS.queue, 1, match]);
  return { ok: true };
}
