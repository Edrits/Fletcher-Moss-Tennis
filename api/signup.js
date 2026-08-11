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
  KEYS, isConfigured, describeCredentialEnv, hgetall, hset, lrangeJSON, del,
  joinAtomic, removeByNames, removeByToken, hitRateLimit
} from './_lib/redis.js';
import { randomUUID } from 'node:crypto';
import { archiveSession } from './_lib/archive.js';
import {
  DEFAULT_CAPACITY, nextSession, defaultOpensAt, sessionEndsAt,
  validateName, shortenName, totalSlots, tierFor, viewModel
} from './_lib/signup-core.js';

const JOIN_ERRORS = {
  already_in: 'You already have a place for this session.',
  full: 'This session is full, including the waiting list.'
};

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
      // Every GET costs two Redis commands, and the page polls while it is open. Thirty
      // members watching the list around opening time is thousands of commands in half an
      // hour, which is enough to run into the Upstash daily allowance and take the list
      // down for everyone. A few seconds of caching removes almost all of it, and the
      // list simply cannot move faster than people can read it anyway.
      //
      // Only cache the anonymous view. A response carrying somebody's own `mine` flags
      // must never be handed to the next caller.
      const myToken = req.headers['x-signup-token'] || null;
      if (!myToken) res.setHeader('Cache-Control', 'public, max-age=5, s-maxage=5');
      else res.setHeader('Cache-Control', 'private, no-store');
      return res.status(200).json(await readState(now, myToken));
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, name, names, token, password, date, label, opensAt, capacity, organiser } = req.body || {};

    // ── Member actions, no password ──────────────────────────────────────────────
    if (action === 'join') {
      // Loose enough for a few people on the same wifi, tight enough that a script
      // cannot swallow the list. Genuine members join once.
      const gateCheck = await hitRateLimit('join', clientId(req), 8, 3600);
      if (!gateCheck.allowed) {
        return res.status(429).json({
          ok: false, error: 'too_many',
          message: 'Too many sign-up attempts from this connection. Wait a little and try again.'
        });
      }

      const meta = await hgetall(KEYS.meta);
      const gate = openState(meta, now);
      if (!gate.open) return res.status(200).json({ ok: false, error: 'not_open', message: gate.message });

      const check = validateName(name);
      if (!check.ok) return res.status(200).json({ ok: false, error: 'invalid_name', message: check.error });
      if (!token) return res.status(200).json({ ok: false, error: 'invalid_name', message: 'Missing sign-up token.' });

      const cap = parseCapacity(meta);
      // Only a first name and an initial ever reach the list. The script resolves a clash
      // against the live queue, so two people who shorten the same way both get in.
      const result = await joinAtomic({
        token: String(token).slice(0, 64),
        displayBase: shortenName(check.name),
        limit: totalSlots(cap),
        at: now.toISOString()
      });

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
      const out = await removeByToken(String(token).slice(0, 64));
      if (out.error) return res.status(200).json({ ok: false, message: out.error });
      return res.status(200).json({ ok: true });
    }

    // ── Admin actions ────────────────────────────────────────────────────────────
    if (!ADMIN_PASSWORD) {
      return res.status(500).json({ error: 'Server is missing ADMIN_PASSWORD configuration' });
    }
    // One shared, human-chosen password with an unlimited-rate check is a dictionary
    // attack waiting to happen, and CORS is open so it can be driven from any page.
    const pwTries = await hitRateLimit('admin', clientId(req), 10, 900);
    if (!pwTries.allowed) {
      return res.status(429).json({ error: 'Too many attempts. Wait fifteen minutes and try again.' });
    }
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    if (action === 'verify') {
      return res.status(200).json({ valid: true });
    }


    // Opens the next session. Archives whatever the last one held before clearing, so the
    // record survives even though the live list does not.
    if (action === 'open') {
      const previous = await hgetall(KEYS.meta);
      const previousEntries = await lrangeJSON(KEYS.queue);

      const slot = nextSession(now);
      const useDate = date || (slot && slot.date);
      if (!useDate) return res.status(400).json({ error: 'No upcoming session found' });
      const useLabel = label || (slot && slot.label) || '';
      const useOpensAt = opensAt || defaultOpensAt(useDate).toISOString();
      const cap = normaliseCapacity(capacity) || DEFAULT_CAPACITY;

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
      if (previous.date && previous.date === useDate && previousEntries.length) {
        await hset(KEYS.meta, {
          label: useLabel, opensAt: useOpensAt, state: 'open',
          endsAt: endsAtFor(useDate)
        });
        return res.status(200).json({
          ok: true, edited: true,
          message: 'That session was already open, so the details were updated and the list left alone.',
          ...(await readState(now, null))
        });
      }

      if (previous.date && previousEntries.length) {
        const archived = await archiveSession({
          date: previous.date,
          label: previous.label,
          capacity: parseCapacity(previous),
          entries: previousEntries
        });
        // Refuse to wipe a list we could not save. Losing who played is worse than a
        // failed button press.
        if (!archived.ok) return res.status(502).json({ error: `Could not archive the last session: ${archived.error}` });
      }

      await del(KEYS.queue, KEYS.meta);
      await hset(KEYS.meta, {
        date: useDate, label: useLabel, opensAt: useOpensAt,
        state: 'open', seeds: '0', capacity: JSON.stringify(cap),
        organiser: '', endsAt: endsAtFor(useDate)
      });

      // Whoever is running the session takes position 1. Added here, against an empty
      // queue, so they are first before anybody can tap. Not protected from removal:
      // if the organiser changes, take them off and add the new one.
      if (organiserDisplay) {
        const seated = await joinAtomic({
          // Must be unguessable. An earlier version used `organiser:<date>`, and the date
          // is published in every public GET, so anyone could post a leave with that token
          // and knock whoever was running the session off the list.
          token: `organiser:${randomUUID()}`,
          displayBase: organiserDisplay,
          limit: totalSlots(cap),
          at: now.toISOString()
        });
        // Record the name that actually landed, so the "Running today" tag matches a real
        // row rather than pointing at nobody.
        await hset(KEYS.meta, { organiser: seated.error ? '' : seated.name });
      }

      return res.status(200).json({ ok: true, ...(await readState(now, null)) });
    }

    // The organiser can put someone on the list at any point, before or after the button
    // goes live. Added to the END of the queue, so it never jumps anyone who has already
    // tapped. `seed` is accepted as well as `add` so older callers keep working.
    if (action === 'add' || action === 'seed') {
      const meta = await hgetall(KEYS.meta);
      if (!meta.date) return res.status(400).json({ error: 'Open a session first' });
      const check = validateName(name);
      if (!check.ok) return res.status(400).json({ error: check.error });

      const cap = parseCapacity(meta);
      const used = Number(meta.seeds || 0);
      const result = await joinAtomic({
        token: `admin:${used + 1}:${now.getTime()}`,
        displayBase: shortenName(check.name),
        limit: totalSlots(cap),
        at: now.toISOString()
      });
      if (result.error) {
        return res.status(400).json({ error: JOIN_ERRORS[result.error] || 'Could not add that person' });
      }

      await hset(KEYS.meta, { seeds: String(used + 1) });
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

      const out = await removeByNames(wanted);
      if (!out.removed.length) {
        return res.status(400).json({
          error: 'Nobody on the list matched those names. The list may have changed, try refreshing.'
        });
      }
      return res.status(200).json({ ok: true, removed: out.removed, missing: out.missing });
    }

    // Archive and clear without opening the next one.
    if (action === 'reset') {
      const meta = await hgetall(KEYS.meta);
      const entries = await lrangeJSON(KEYS.queue);
      if (meta.date && entries.length) {
        const archived = await archiveSession({
          date: meta.date, label: meta.label, capacity: parseCapacity(meta), entries
        });
        if (!archived.ok) return res.status(502).json({ error: `Could not archive: ${archived.error}` });
      }
      await del(KEYS.queue, KEYS.meta);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });

  } catch (err) {
    console.error('signup error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
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
  const [meta, entries] = await Promise.all([hgetall(KEYS.meta), lrangeJSON(KEYS.queue)]);
  return viewModel({ meta: { ...meta, capacity: parseCapacity(meta) }, entries, now, myToken });
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
