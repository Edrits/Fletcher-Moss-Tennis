import { command, KEYS } from './redis.js';

// No expiry: a failed archive must leave a recoverable, frozen list, not reopen a race.
export const TRANSITION_KEY = 'fm:signup:transition';
export const sessionIdentity = meta => meta.generation || (meta.date ? `legacy:${meta.date}` : 'empty');

// Every live-list writer uses the same gate. Freeze, snapshot and final replacement are
// atomic; the slow GitHub request happens between them without allowing queue changes.
export const STORE_SCRIPT = `
local queue, metaKey, transitionKey = KEYS[1], KEYS[2], KEYS[3]
local input = cjson.decode(ARGV[1])
local function reply(value) return cjson.encode(value) end
local function fail(code) return reply({error=code}) end
local function metadata()
  local flat = redis.call('HGETALL', metaKey)
  local meta = {}
  for i=1,#flat,2 do meta[flat[i]]=flat[i+1] end
  return meta
end
local function entries()
  local out = {}
  for _,raw in ipairs(redis.call('LRANGE',queue,0,-1)) do
    table.insert(out,cjson.decode(raw))
  end
  return out
end
local function writeMeta(meta)
  for key,value in pairs(meta) do redis.call('HSET',metaKey,key,tostring(value)) end
end
local meta = metadata()
local identity = meta.generation or (meta.date and 'legacy:' .. meta.date or 'empty')
local pending = redis.call('GET',transitionKey)
if input.action == 'read' then
  return reply({meta=meta,entries=entries(),transitioning=pending and true or false})
end
if input.action == 'pending' then return pending or '{}' end
if input.action == 'finish' then
  if not pending then return fail('stale_session') end
  local transition = cjson.decode(pending)
  if transition.id ~= input.id then return fail('stale_session') end
  -- Decode and validate the stored target before deleting anything.
  local nextMeta = transition.nextMeta
  local organiser = transition.organiser
  redis.call('DEL',queue,metaKey)
  if nextMeta and nextMeta ~= cjson.null then
    writeMeta(nextMeta)
    if organiser and organiser ~= cjson.null then
      redis.call('RPUSH',queue,cjson.encode(organiser))
    end
  end
  redis.call('DEL',transitionKey)
  return reply({ok=true})
end
if pending then return fail('transitioning') end
if input.sessionId ~= identity then return fail('stale_session') end
if input.action == 'freeze' then
  local transition = {id=input.id,meta=meta,entries=entries(),nextMeta=input.nextMeta,
    organiser=input.organiser,archivedAt=input.archivedAt}
  -- The live queue is kept untouched until its durable archive has succeeded.
  local encoded = cjson.encode(transition)
  redis.call('SET',transitionKey,encoded)
  return encoded
end
if input.action == 'edit' then
  if input.changes.capacity then
    local cap = cjson.decode(input.changes.capacity)
    if redis.call('LLEN',queue) > cap.main + cap.subs + cap.waitlist then
      return fail('capacity_too_small')
    end
  end
  writeMeta(input.changes)
  return reply({ok=true})
end
if not meta.date then return fail('stale_session') end
if input.action == 'join' or input.action == 'seed' then
  -- Gate values and capacity must still be those the handler read, including legacy data.
  if (meta.opensAt or '') ~= input.opensAt or (meta.endsAt or '') ~= input.endsAt or
     (meta.capacity or '') ~= input.capacity then return fail('stale_session') end
  if input.action == 'join' then
    local clock = redis.call('TIME')
    local now = tonumber(clock[1])*1000 + math.floor(tonumber(clock[2])/1000)
    if meta.state ~= 'open' or now < input.starts or now >= input.ends then return fail('not_open') end
    if (meta.pin or '') ~= input.pin then return fail('bad_pin') end
  end
  local rows = entries()
  local used = {}
  for _,entry in ipairs(rows) do
    if entry.token == input.token then return fail('already_in') end
    used[entry.key or string.lower(entry.name)] = true
  end
  if #rows >= input.limit then return fail('full') end
  local name, key, suffix = input.name,input.nameKey,1
  while used[key] do
    suffix=suffix+1; name=input.name .. suffix; key=input.nameKey .. suffix
  end
  redis.call('RPUSH',queue,cjson.encode({name=name,key=key,token=input.token,at=input.at}))
  return reply({position=#rows+1,name=name})
end
if input.action == 'leave' or input.action == 'remove' then
  local wanted, removed = {},{}
  for _,name in ipairs(input.names or {}) do wanted[name]=true end
  for _,raw in ipairs(redis.call('LRANGE',queue,0,-1)) do
    local entry=cjson.decode(raw)
    local key=entry.key or string.lower(entry.name)
    if (input.action == 'leave' and entry.token == input.token) or
       (input.action == 'remove' and wanted[key]) then
      redis.call('LREM',queue,1,raw)
      table.insert(removed,entry.name); wanted[key]=nil
    end
  end
  local missing={}
  for name,_ in pairs(wanted) do table.insert(missing,name) end
  return reply({ok=true,removed=removed,missing=missing})
end
return fail('unknown_action')
`;

export async function signupStore(input) {
  const result = JSON.parse(await command(['EVAL', STORE_SCRIPT, 3, KEYS.queue, KEYS.meta, TRANSITION_KEY, JSON.stringify(input)]));
  // Redis Lua encodes empty tables as objects. Keep API arrays stable.
  for (const key of ['entries', 'removed', 'missing']) {
    if (result[key] && !Array.isArray(result[key])) result[key] = [];
  }
  return result;
}

export function admission(meta, { token, name, pin = '', admin = false, at = new Date().toISOString() }) {
  const starts = meta.opensAt ? Date.parse(meta.opensAt) : 0;
  const ends = meta.endsAt ? Date.parse(meta.endsAt) : 8640000000000000;
  if (!Number.isFinite(starts) || !Number.isFinite(ends)) throw new Error('The session times are invalid. Ask the organiser to correct them.');
  let cap;
  try { cap = JSON.parse(meta.capacity || '{"main":16,"subs":2,"waitlist":10}'); } catch { throw new Error('The session capacity is invalid.'); }
  if (!cap || ['main','subs','waitlist'].some(k => !Number.isInteger(cap[k]) || cap[k]<0 || cap[k]>60)) throw new Error('The session capacity is invalid.');
  return {action:admin?'seed':'join',sessionId:sessionIdentity(meta),token,name,nameKey:name.toLowerCase(),pin,
    opensAt:meta.opensAt || '',endsAt:meta.endsAt || '',capacity:meta.capacity || '',starts,ends,
    limit:cap.main+cap.subs+cap.waitlist,at};
}
