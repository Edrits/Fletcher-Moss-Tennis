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

// Crude per-caller throttle. The endpoint is public and unauthenticated, so without this
// one script can take all 28 places in a couple of seconds at opening time, before any
// member's thumb lands.
//
// Keyed on the forwarded client IP. Several members on the same home wifi or on mobile
// carrier NAT share an address, so the limit has to be loose enough not to catch a couple
// of housemates signing up together.
export async function hitRateLimit(bucket, id, limit, windowSeconds) {
  const key = `fm:rate:${bucket}:${id}`;
  // Create the counter with its expiry first, then count. INCR-then-EXPIRE left a counter
  // with no expiry, and that caller locked out for good, if the second command failed.
  await command(['SET', key, 0, 'EX', windowSeconds, 'NX']);
  const count = Number(await command(['INCR', key]));
  return { allowed: count <= limit, count };
}

// Hand back an attempt counted by hitRateLimit, for a request that turned out to be
// legitimate (the right admin password). The organiser's own work is never throttled.
export async function refundRateLimit(bucket, id) {
  await command(['DECR', `fm:rate:${bucket}:${id}`]);
}
