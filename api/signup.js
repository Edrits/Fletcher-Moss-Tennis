// Session sign-up endpoint.
//
// One session is live at a time. It opens at a set time the night before, fills strictly in
// tap order, is played, and is reset when the next one opens.
//
//   positions  1-16  main players (4 courts of 4)
//   positions 17-18  subs
//   positions 19-28  waiting list
//
// Removing anyone shifts everybody below up one place. That is the cascade the club already
// runs by hand, and it falls out of storing the queue as an ordered list rather than being
// separate promotion logic.
//
// Live state lives in Redis, not in the repo: sign-up opens at a fixed moment and everyone
// taps at once, which the GitHub Contents API cannot absorb. The finished list is archived
// to the repo once, on reset.
import {
  KEYS, isConfigured, describeCredentialEnv, hgetall, hitRateLimit, peekRateLimit
} from './_lib/redis.js';
import { signupStore, sessionIdentity, admission } from './_lib/signup-store.js';
import { randomUUID, randomInt } from 'node:crypto';
import { archiveSession } from './_lib/archive.js';
import {
  DEFAULT_CAPACITY, nextSession, defaultOpensAt, sessionEndsAt,
  validateName, shortenName, totalSlots, tierFor, viewModel, labelForDate,
  validatePin, normalisePin, shareMessage, PIN_LENGTH
} from './_lib/signup-core.js';

// Wrong-password guesses allowed per connection per fifteen minutes. Successful admin
// actions do not count against it, so this only ever has to be large enough for typos.
const ADMIN_ATTEMPT_LIMIT = 10;

const JOIN_ERRORS = {
  already_in: 'You already have a place for this session.',
  full: 'This session is full, including the waiting list.',
  stale_session: 'The session has changed. Refresh the list and try again.',
  transitioning: 'The organiser is updating the session. The list is safe. Please try again shortly.',
  not_open: 'Sign-up is not open for this session.',
  bad_pin: 'That code is not right. Check the message in the WhatsApp group.'
};

// Drawn with the crypto RNG rather than Math.random: the code is what stands between the
// public endpoint and the club's places, and Math.random is predictable from prior output.
function generatePin() {
  return String(randomInt(0, 10 ** PIN_LENGTH)).padStart(PIN_LENGTH, '0');
}

export default async function handler(req, res) {
  // Set in the Vercel environment config, never committed to this repo
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Signup-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!isConfigured()) {
    // List the variable NAMES the deployment actually has, never their values, so a
    // naming mismatch is obvious instead of being guessed at through repeated deploys.
    const found = describeCredentialEnv(process.env);
    return res.status(500).json({
      error: 'Sign-up storage is not configured on this deployment',
      hint: found.length
        ? `Found these related environment variables, but no usable URL and token pair: ${found.join(', ')}`
        : 'No Redis-related environment variables are present. Add the Upstash integration in the Vercel dashboard.'
    });
  }

  const now = new Date();

  try {
    if (req.method === 'GET') {
      // Only the anonymous view is cacheable. A response carrying somebody's own `mine`
      // flags must never be handed to the next caller.
      //
      // Vary is what makes that hold. Without it the CDN keys purely on the URL, so an
      // anonymous response cached from any caller was served straight back to a member
      // who HAD sent a token: their `you` block and `mine` flags vanished, their place
      // disappeared from the page and the "Can't make it" button went with it, for as
      // long as the entry lived. Confirmed against production, not theoretical.
      //
      // Note this does not reduce load the way the previous comment here claimed. The
      // page always sends a token, so in practice every real poll is a miss and costs its
      // two Redis commands. The cache only ever helps anonymous callers. Cutting the real
      // per-member cost needs the personalisation moved off the response so every caller
      // can share one cached body, which is a change to the API shape, not a header.
      const myToken = req.headers['x-signup-token'] || null;
      res.setHeader('Vary', 'X-Signup-Token');
      if (!myToken) res.setHeader('Cache-Control', 'public, max-age=5, s-maxage=5');
      else res.setHeader('Cache-Control', 'private, no-store');
      return res.status(200).json(await readState(now, myToken));
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, name, names, token, password, date, label, opensAt, capacity, organiser, force, pin, sessionId } = req.body || {};

    // ── Member actions, no password ──────────────────────────────────────────────
    if (action === 'join') {
      // Loose enough for a few people on the same wifi, tight enough that a script
      // cannot swallow the list. Genuine members join once.
      //
      // This runs BEFORE the not-open gate and the code check, so an innocent tap before
      // sign-up opens, or a fat-fingered code, spends an attempt too. At 8 that meant a
      // member who fumbled the four-digit code a few times, or a couple sharing a home or
      // carrier-NAT IP, could be told "too many attempts" while holding the right code.
      // 15 gives honest fumbling real headroom and still bounds guessing the code hard:
      // 15 wrong guesses an hour against 10,000 combinations is about a month.
      const gateCheck = await hitRateLimit('join', clientId(req), 15, 3600);
      if (!gateCheck.allowed) {
        return res.status(429).json({
          ok: false, error: 'too_many',
          message: 'Too many sign-up attempts from this connection. Wait a little and try again.'
        });
      }

      const meta = await hgetall(KEYS.meta);
      if (sessionId !== sessionIdentity(meta)) return storeFailure(res, 'stale_session');
      const gate = openState(meta, now);
      if (!gate.open) return res.status(200).json({ ok: false, error: 'not_open', message: gate.message });

      // The session code, checked before anything is written. A session opened before codes
      // existed carries no `pin`, and stays joinable without one rather than locking out a
      // list that is already running.
      //
      // A wrong code still costs the caller one of their fifteen hourly join attempts, which
      // is what makes a four digit code sufficient: the limit is spent long before the
      // ten thousand possibilities are.
      if (meta.pin && normalisePin(pin) !== meta.pin) {
        return res.status(200).json({
          ok: false, error: 'bad_pin',
          message: validatePin(pin)
            ? 'That code is not right. Check the message in the WhatsApp group.'
            : `Enter the ${PIN_LENGTH} digit code from the WhatsApp group.`
        });
      }

      const check = validateName(name);
      if (!check.ok) return res.status(200).json({ ok: false, error: 'invalid_name', message: check.error });
      if (!token) return res.status(200).json({ ok: false, error: 'invalid_name', message: 'Missing sign-up token.' });

      const cap = parseCapacity(meta);
      // Only a first name and an initial ever reach the list. The script resolves a clash
      // against the live queue, so two people who shorten the same way both get in.
      const result = await signupStore(admission(meta, {
        token: String(token).slice(0, 64),
        name: shortenName(check.name), pin: normalisePin(pin),
        at: now.toISOString()
      }));

      if (result.error) {
        return res.status(200).json({
          ok: false, error: result.error, message: JOIN_ERRORS[result.error] || 'Could not sign you up.'
        });
      }
      return res.status(200).json({
        ok: true, position: result.position, name: result.name, tier: tierFor(result.position, cap)
      });
    }

    if (action === 'leave') {
      if (!token) return res.status(200).json({ ok: false, message: 'Missing sign-up token.' });
      const out = await signupStore({ action: 'leave', sessionId, token: String(token).slice(0, 64) });
      if (out.error) return storeFailure(res, out.error);
      if (!out.removed.length) return res.status(200).json({ ok: false, message: 'No sign-up found on this device.' });
      return res.status(200).json({ ok: true });
    }

    // ── Admin actions ────────────────────────────────────────────────────────────
    if (!ADMIN_PASSWORD) {
      return res.status(500).json({ error: 'Server is missing ADMIN_PASSWORD configuration' });
    }
    // One shared, human-chosen password with an unlimited-rate check is a dictionary
    // attack waiting to happen, and CORS is open so it can be driven from any page.
    //
    // Only a WRONG password spends an attempt. This used to increment on every admin
    // request, so an organiser running a session normally (unlock, open, add a couple of
    // names, take a couple off) spent the whole allowance while holding the correct
    // password, and was then locked out for fifteen minutes mid-session. Reading the
    // counter before checking, and spending only on a failure, keeps a guesser capped at
    // ADMIN_ATTEMPT_LIMIT wrong guesses per window while leaving legitimate work
    // completely unthrottled.
    const spent = await peekRateLimit('admin', clientId(req));
    if (spent >= ADMIN_ATTEMPT_LIMIT) {
      return res.status(429).json({
        error: 'Too many incorrect passwords from this connection. Wait fifteen minutes and try again.'
      });
    }
    if (password !== ADMIN_PASSWORD) {
      const used = await hitRateLimit('admin', clientId(req), ADMIN_ATTEMPT_LIMIT, 900);
      const left = Math.max(0, ADMIN_ATTEMPT_LIMIT - used.count);
      return res.status(401).json({
        error: left
          ? `Incorrect password. ${left} ${left === 1 ? 'try' : 'tries'} left before this connection is locked out for fifteen minutes.`
          : 'Incorrect password. This connection is now locked out for fifteen minutes.'
      });
    }

    // Unlocking the panel also returns the live session's code and the message to paste
    // into the group, so an organiser who reloads the page can get at both again. This is
    // behind the password check above, and the code appears in no public response.
    if (action === 'verify') {
      const meta = await hgetall(KEYS.meta);
      return res.status(200).json({ valid: true, ...organiserExtras(meta) });
    }

    if (action === 'resume_transition') {
      const pending = await signupStore({ action: 'pending' });
      if (!pending.id) return res.status(200).json({ ok: true, ...(await readState(now, null)) });
      return completeTransition(res, pending, now);
    }


    // Opens the next session. Archives whatever the last one held before clearing, so the
    // record survives even though the live list does not.
    if (action === 'open') {
      const snapshot = await signupStore({ action: 'read' });
      const previous = snapshot.meta;
      if (snapshot.transitioning) return storeFailure(res, 'transitioning');
      if (sessionId !== sessionIdentity(previous)) return storeFailure(res, 'stale_session');

      const slot = nextSession(now);
      const useDate = date || (slot && slot.date);
      if (!useDate) return res.status(400).json({ error: 'No upcoming session found' });
      // Keyed off the date being opened, not off `slot` (which is the next session from
      // now). Opening Thursday's list on a Monday would otherwise label it Monday.
      const useLabel = label || labelForDate(useDate) || (slot && slot.label) || '';
      const useOpensAt = opensAt || defaultOpensAt(useDate).toISOString();
      const cap = normaliseCapacity(capacity) || DEFAULT_CAPACITY;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(useDate) || !Number.isFinite(Date.parse(useDate)) || !Number.isFinite(Date.parse(useOpensAt))) {
        return res.status(400).json({ error: 'Please enter a valid session date and opening time.' });
      }

      // Validate BEFORE anything is destroyed. This used to run after the wipe, so a
      // rejected organiser name left the old list archived and gone and the new session
      // live with nobody at position 1, while the admin was told the name was invalid and
      // reasonably assumed nothing had happened.
      let organiserDisplay = '';
      if (organiser) {
        const check = validateName(organiser);
        if (!check.ok) return res.status(400).json({ error: `Organiser name: ${check.error}` });
        organiserDisplay = shortenName(check.name);
      }

      // Re-opening the session that is already live would archive and delete everyone who
      // has already tapped, and the date box is pre-filled with that very date, so an
      // admin correcting a typo could wipe the list. Treat it as an edit instead.
      //
      // `force` is the deliberate way past this. Without it there was no way at all to
      // cancel a session and build it again from scratch: the only control that cleared
      // the list also closed sign-up, and pressing Open on the same date silently kept
      // the old names. The page asks for confirmation before it sends force, so the
      // typo-protection above still holds for the accidental case.
      if (previous.date && previous.date === useDate && !force) {
        const editedResult = await signupStore({ action: 'edit', sessionId, changes: {
          label: useLabel, opensAt: useOpensAt, state: 'open',
          endsAt: endsAtFor(useDate)
        } });
        if (editedResult.error) return storeFailure(res, editedResult.error);
        // Deliberately does NOT mint a new code. People already hold the old one, and
        // rotating it here would lock out everyone who had the message but had not yet
        // tapped, for the sake of an edit to the label or the opening time.
        const edited = await hgetall(KEYS.meta);
        return res.status(200).json({
          ok: true, edited: true,
          message: 'That session was already open, so the details were updated and the list left alone.',
          ...organiserExtras(edited),
          ...(await readState(now, null))
        });
      }

      // A fresh code per session. Last week's, still sitting in the group's history, must
      // not open this week's list.
      const sessionPin = generatePin();
      const nextMeta = {
        date: useDate, label: useLabel, opensAt: useOpensAt,
        state: 'open', seeds: '0', capacity: JSON.stringify(cap),
        organiser: organiserDisplay, endsAt: endsAtFor(useDate), pin: sessionPin,
        generation: randomUUID()
      };

      // Whoever is running the session takes position 1. Added here, against an empty
      // queue, so they are first before anybody can tap. Not protected from removal:
      // if the organiser changes, take them off and add the new one.
      if (organiserDisplay && totalSlots(cap) < 1) return res.status(400).json({ error: 'Allow at least one place for the organiser.' });
      const pending = await signupStore({
        action: 'freeze', sessionId, id: randomUUID(), nextMeta, archivedAt: now.toISOString(),
        organiser: organiserDisplay ? { token: `organiser:${randomUUID()}`, name: organiserDisplay,
          key: organiserDisplay.toLowerCase(), at: now.toISOString() } : null
      });
      if (pending.error) return storeFailure(res, pending.error);
      return completeTransition(res, pending, now);
    }

    // The organiser can put someone on the list at any point, before or after the button
    // goes live. Added to the END of the queue, so it never jumps anyone who has already
    // tapped. `seed` is accepted as well as `add` so older callers keep working.
    if (action === 'add' || action === 'seed') {
      const meta = await hgetall(KEYS.meta);
      if (!meta.date) return res.status(400).json({ error: 'Open a session first' });
      if (sessionId !== sessionIdentity(meta)) return storeFailure(res, 'stale_session');
      const check = validateName(name);
      if (!check.ok) return res.status(400).json({ error: check.error });

      const cap = parseCapacity(meta);
      const result = await signupStore(admission(meta, {
        token: `admin:${randomUUID()}`, admin: true,
        name: shortenName(check.name),
        at: now.toISOString()
      }));
      if (result.error) {
        return res.status(400).json({ error: JOIN_ERRORS[result.error] || 'Could not add that person' });
      }

      return res.status(200).json({
        ok: true, position: result.position, name: result.name,
        tier: tierFor(result.position, cap)
      });
    }

    // Remove one person or several in a single call. Keyed on NAME rather than position,
    // because positions shift the moment anyone leaves and an admin screen a few seconds
    // out of date would otherwise take off the wrong person.
    if (action === 'remove') {
      const wanted = Array.isArray(names) ? names : (name ? [name] : []);
      if (!wanted.length) return res.status(400).json({ error: 'No names given to remove' });

      const out = await signupStore({ action: 'remove', sessionId, names: wanted.map(n => String(n).trim().toLowerCase()) });
      if (out.error) return storeFailure(res, out.error);
      if (!out.removed.length) {
        return res.status(400).json({
          error: 'Nobody on the list matched those names. The list may have changed, try refreshing.'
        });
      }
      return res.status(200).json({ ok: true, removed: out.removed, missing: out.missing });
    }

    // Archive and clear without opening the next one.
    if (action === 'reset') {
      const pending = await signupStore({ action: 'freeze', sessionId, id: randomUUID(),
        nextMeta: null, organiser: null, archivedAt: now.toISOString() });
      if (pending.error) return storeFailure(res, pending.error);
      return completeTransition(res, pending, now);
    }

    return res.status(400).json({ error: 'Unknown action' });

  } catch (err) {
    console.error('signup error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

// The two things only the organiser may see: the session code, and the finished message to
// paste into the group. Kept in one place so it cannot accidentally be attached to a public
// response, and returned only from password-checked branches.
function organiserExtras(meta) {
  if (!meta || !meta.date) return { pin: null, shareText: null };
  return {
    pin: meta.pin || null,
    shareText: shareMessage({ label: meta.label, pin: meta.pin })
  };
}

function endsAtFor(dateStr) {
  const end = sessionEndsAt(dateStr);
  return end ? end.toISOString() : '';
}

// Vercel puts the real caller at the front of x-forwarded-for. Anything absent falls back
// to a shared bucket, which throttles a little too eagerly rather than not at all.
function clientId(req) {
  const fwd = req.headers['x-forwarded-for'];
  const first = Array.isArray(fwd) ? fwd[0] : String(fwd || '').split(',')[0];
  return (first || req.headers['x-real-ip'] || 'unknown').trim().slice(0, 45);
}

async function readState(now, myToken) {
  const { meta, entries, transitioning } = await signupStore({ action: 'read' });
  return { ...viewModel({ meta: { ...meta, capacity: parseCapacity(meta), ...(transitioning ? { state: 'closed' } : {}) }, entries, now, myToken }),
    sessionId: sessionIdentity(meta), transitioning };
}

function storeFailure(res, code) {
  return res.status(409).json({ ok: false, error: code, message: JOIN_ERRORS[code] || 'The list changed. Refresh and try again.' });
}

async function completeTransition(res, pending, now) {
  try {
    if (pending.meta.date && pending.entries.length) {
      const archived = await archiveSession({ date: pending.meta.date, label: pending.meta.label,
        capacity: parseCapacity(pending.meta), entries: pending.entries, archiveId: pending.id, archivedAt: pending.archivedAt });
      if (!archived.ok) throw new Error(archived.error);
    }
    const finished = await signupStore({ action: 'finish', id: pending.id });
    if (finished.error) return storeFailure(res, finished.error);
    return res.status(200).json({ ok: true, ...organiserExtras(pending.nextMeta), ...(await readState(now, null)) });
  } catch (err) {
    console.error('Session transition paused:', err);
    return res.status(502).json({ ok: false, error: 'transition_paused',
      message: 'The update could not finish. The list is kept safe and paused. Use Resume session update to try again.' });
  }
}

// The server decides whether sign-up is open. A browser clock that is a few minutes fast
// must not be able to get someone in early.
function openState(meta, now) {
  if (!meta || !meta.date) return { open: false, message: 'No session is open yet.' };
  if (meta.state !== 'open') return { open: false, message: 'Sign-up is not open yet.' };
  if (meta.opensAt && now < new Date(meta.opensAt)) {
    return { open: false, message: 'Sign-up has not opened yet.' };
  }
  // A played session must stop taking names even if nobody reset it. Otherwise a tap on
  // Wednesday joins the waiting list for Monday's game.
  if (meta.endsAt) {
    const endsAt = new Date(meta.endsAt);
    if (!Number.isNaN(endsAt.getTime()) && now >= endsAt) {
      return { open: false, message: 'That session has finished. Sign-up for the next one opens the night before.' };
    }
  }
  return { open: true };
}

function parseCapacity(meta) {
  if (!meta || !meta.capacity) return DEFAULT_CAPACITY;
  try {
    return normaliseCapacity(JSON.parse(meta.capacity)) || DEFAULT_CAPACITY;
  } catch {
    return DEFAULT_CAPACITY;
  }
}

function normaliseCapacity(cap) {
  if (!cap || typeof cap !== 'object') return null;
  const n = (v, fallback) => {
    const parsed = Number(v);
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= 60 ? parsed : fallback;
  };
  return {
    main: n(cap.main, DEFAULT_CAPACITY.main),
    subs: n(cap.subs, DEFAULT_CAPACITY.subs),
    waitlist: n(cap.waitlist, DEFAULT_CAPACITY.waitlist)
  };
}
