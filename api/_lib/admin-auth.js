// The one admin password check, shared by every endpoint that accepts it.
//
// One shared, human-chosen password with an unlimited-rate check is a dictionary attack
// waiting to happen, and CORS is open so it can be driven from any page. The throttle has
// to live on EVERY endpoint that checks the password: a limit on sign-up alone just sends
// the guesser to the noticeboard, league, pairings or booking endpoint instead. All of
// them spend from the same Redis counter, so a connection gets ADMIN_ATTEMPT_LIMIT wrong
// guesses in total, not that many per endpoint.
//
// Only a WRONG password spends an attempt. This used to increment on every admin request,
// so an organiser running a session normally (unlock, open, add a couple of names, take a
// couple off) spent the whole allowance while holding the correct password, and was then
// locked out for fifteen minutes mid-session.
//
// Every attempt is counted BEFORE the password is compared, and a right password gets its
// attempt back. Reading the counter first and only counting failures afterwards let a
// burst of simultaneous guesses all read zero, so hundreds were checked before any of them
// was counted.
import { hitRateLimit, refundRateLimit } from './redis.js';

const ADMIN_ATTEMPT_LIMIT = 10;
const WINDOW_SECONDS = 900;

// Vercel puts the real caller at the front of x-forwarded-for. Anything absent falls back
// to a shared bucket, which throttles a little too eagerly rather than not at all.
//
// An IPv6 address is counted by its /64 network. One connection is usually handed a whole
// /64, billions of addresses, so counting single addresses let anyone rotate past every
// limit here.
export function clientId(req) {
  const fwd = req.headers['x-forwarded-for'];
  const first = Array.isArray(fwd) ? fwd[0] : String(fwd || '').split(',')[0];
  const ip = (first || req.headers['x-real-ip'] || 'unknown').trim().slice(0, 45);
  // An IPv4 address written in IPv6 form (::ffff:1.2.3.4) is still one IPv4 address.
  if (ip.includes('.')) return ip.slice(ip.lastIndexOf(':') + 1);
  return ip.includes(':') ? ipv6Prefix64(ip) : ip;
}

function ipv6Prefix64(ip) {
  const [head, tail = ''] = ip.toLowerCase().split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = ip.includes('::')
    ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right]
    : left;
  return groups.slice(0, 4).map(g => g.replace(/^0+(?=.)/, '')).join(':') + '::/64';
}

// Returns null when the password is right. Otherwise returns { status, error } for the
// caller to send back, and nothing else should happen.
export async function checkAdminPassword(req, password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return { status: 500, error: 'Server is missing ADMIN_PASSWORD configuration' };
  }
  const id = clientId(req);
  const used = await hitRateLimit('admin', id, ADMIN_ATTEMPT_LIMIT, WINDOW_SECONDS);
  if (!used.allowed) {
    return { status: 429, error: 'Too many incorrect passwords from this connection. Wait fifteen minutes and try again.' };
  }
  if (password === expected) {
    await refundRateLimit('admin', id);
    return null;
  }

  const left = Math.max(0, ADMIN_ATTEMPT_LIMIT - used.count);
  return {
    status: 401,
    error: left
      ? `Incorrect password. ${left} ${left === 1 ? 'try' : 'tries'} left before this connection is locked out for fifteen minutes.`
      : 'Incorrect password. This connection is now locked out for fifteen minutes.'
  };
}
