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
  joinAtomic, removeAt, removeByToken
} from './_lib/redis.js';
import { archiveSession } from './_lib/archive.js';
import {
  DEFAULT_CAPACITY, MAX_SEEDS, nextSession, defaultOpensAt,
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
      return res.status(200).json(await readState(now, req.headers['x-signup-token'] || null));
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, name, token, password, date, label, opensAt, position, capacity } = req.body || {};

    // ── Member actions, no password ──────────────────────────────────────────────
    if (action === 'join') {
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

      const slot = nextSession(now);
      const useDate = date || (slot && slot.date);
      if (!useDate) return res.status(400).json({ error: 'No upcoming session found' });
      const useLabel = label || (slot && slot.label) || '';
      const useOpensAt = opensAt || defaultOpensAt(useDate).toISOString();
      const cap = normaliseCapacity(capacity) || DEFAULT_CAPACITY;

      await del(KEYS.queue, KEYS.meta);
      await hset(KEYS.meta, {
        date: useDate, label: useLabel, opensAt: useOpensAt,
        state: 'open', seeds: '0', capacity: JSON.stringify(cap)
      });
      return res.status(200).json({ ok: true, ...(await readState(now, null)) });
    }

    // Admins may take a few places before the button goes live. Capped so a real race
    // remains for everyone else.
    if (action === 'seed') {
      const meta = await hgetall(KEYS.meta);
      if (!meta.date) return res.status(400).json({ error: 'Open a session first' });
      const used = Number(meta.seeds || 0);
      if (used >= MAX_SEEDS) {
        return res.status(400).json({ error: `Only ${MAX_SEEDS} places can be reserved before opening` });
      }
      if (openState(meta, now).open) {
        return res.status(400).json({ error: 'Sign-up is already open, so places can no longer be reserved' });
      }
      const check = validateName(name);
      if (!check.ok) return res.status(400).json({ error: check.error });

      const cap = parseCapacity(meta);
      const result = await joinAtomic({
        token: `seed:${used + 1}:${Date.now()}`,
        displayBase: shortenName(check.name),
        limit: totalSlots(cap),
        at: now.toISOString()
      });
      if (result.error) return res.status(400).json({ error: JOIN_ERRORS[result.error] || 'Could not reserve that place' });

      await hset(KEYS.meta, { seeds: String(used + 1) });
      return res.status(200).json({ ok: true, position: result.position, name: result.name });
    }

    if (action === 'remove') {
      const out = await removeAt(Number(position));
      if (out.error) return res.status(400).json({ error: out.error });
      return res.status(200).json({ ok: true });
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
