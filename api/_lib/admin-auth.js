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
// locked out for fifteen minutes mid-session. Reading the counter before checking, and
// spending only on a failure, keeps a guesser capped while leaving legitimate work
// completely unthrottled.
import { hitRateLimit, peekRateLimit } from './redis.js';

const ADMIN_ATTEMPT_LIMIT = 10;
const WINDOW_SECONDS = 900;

// Vercel puts the real caller at the front of x-forwarded-for. Anything absent falls back
// to a shared bucket, which throttles a little too eagerly rather than not at all.
export function clientId(req) {
  const fwd = req.headers['x-forwarded-for'];
  const first = Array.isArray(fwd) ? fwd[0] : String(fwd || '').split(',')[0];
  return (first || req.headers['x-real-ip'] || 'unknown').trim().slice(0, 45);
}

// Returns null when the password is right. Otherwise returns { status, error } for the
// caller to send back, and nothing else should happen.
export async function checkAdminPassword(req, password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return { status: 500, error: 'Server is missing ADMIN_PASSWORD configuration' };
  }
  const id = clientId(req);
  if (await peekRateLimit('admin', id) >= ADMIN_ATTEMPT_LIMIT) {
    return { status: 429, error: 'Too many incorrect passwords from this connection. Wait fifteen minutes and try again.' };
  }
  if (password === expected) return null;

  const used = await hitRateLimit('admin', id, ADMIN_ATTEMPT_LIMIT, WINDOW_SECONDS);
  const left = Math.max(0, ADMIN_ATTEMPT_LIMIT - used.count);
  return {
    status: 401,
    error: left
      ? `Incorrect password. ${left} ${left === 1 ? 'try' : 'tries'} left before this connection is locked out for fifteen minutes.`
      : 'Incorrect password. This connection is now locked out for fifteen minutes.'
  };
}
