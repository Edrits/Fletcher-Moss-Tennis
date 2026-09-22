// Court booking backend for the singles court-booking grid on box-league.html.
//
// Follows the same "GitHub repo as the database" pattern as the other handlers:
// this function reads and writes bookings.json in this repo via the GitHub
// Contents API. Booking data is deliberately kept separate from boxleague.json.
//
// The week resets every Sunday morning. There is no cron job: the reset is
// lazy. Each request works out the current booking week from the server clock
// (Europe/London), and whenever the stored week is stale the bookings are
// treated as empty. The empty state is committed on the next write of the new
// week, so a plain read never writes.
//
// Slots are singles games in the hour after each club session:
//   Monday and Thursday  8:00 to 9:00 PM
//   Saturday             1:00 to 2:00 PM
// Each slot is one hour on courts 1 to 4 (one slot per day).
//
// Requires GIT_TOKEN (GitHub token with contents write access) and, for the
// admin cancel/clear operations, ADMIN_PASSWORD. Both come from the Vercel
// environment, never the repo. Booking a slot is public; cancelling is admin.

export default async function handler(req, res) {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const GITHUB_TOKEN = process.env.GIT_TOKEN;
  const GITHUB_USER = 'Edrits';
  const GITHUB_REPO = 'Fletcher-Moss-Tennis';
  const DATA_FILE = 'bookings.json';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const githubUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${DATA_FILE}`;

  // Singles booking slots: one hour after each session, one slot per day.
  const COURTS = [1, 2, 3, 4];
  const SCHEDULE = {
    days: [
      { id: 'mon', label: 'Monday', session: '8:00 to 9:00 PM', times: ['20:00'] },
      { id: 'thu', label: 'Thursday', session: '8:00 to 9:00 PM', times: ['20:00'] },
      { id: 'sat', label: 'Saturday', session: '1:00 to 2:00 PM', times: ['13:00'] }
    ],
    courts: COURTS
  };

  // The booking week begins on Sunday. Work out the date (YYYY-MM-DD) of the
  // Sunday that starts the current week in Europe/London, so the grid clears at
  // London midnight on Sunday regardless of the server's own timezone.
  function currentWeekKey(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', weekday: 'short',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(now);
    const get = t => parts.find(p => p.type === t).value;
    const weekdayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    // Pure-date arithmetic in UTC avoids any daylight-saving hour drift; we only
    // care about the calendar date of the most recent Sunday.
    const base = new Date(Date.UTC(+get('year'), +get('month') - 1, +get('day')));
    base.setUTCDate(base.getUTCDate() - weekdayIndex);
    const y = base.getUTCFullYear();
    const m = String(base.getUTCMonth() + 1).padStart(2, '0');
    const d = String(base.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const validKeys = new Set();
  SCHEDULE.days.forEach(day =>
    day.times.forEach(t =>
      COURTS.forEach(c => validKeys.add(`${day.id}|${c}|${t}`))
    )
  );

  function sanitiseName(raw) {
    if (typeof raw !== 'string') return '';
    return raw.replace(/\s+/g, ' ').trim().slice(0, 40);
  }

  // Return the stored data, but blanked to an empty week whenever the stored
  // week is not the current one. Never mutates in place for a stale week.
  function withCurrentWeek(data) {
    const week = currentWeekKey();
    if (!data || data.weekKey !== week) return { weekKey: week, bookings: {} };
    if (!data.bookings || typeof data.bookings !== 'object') data.bookings = {};
    return data;
  }

  function fail(status, message) {
    const err = new Error(message);
    err.httpStatus = status;
    return err;
  }

  async function readData() {
    const response = await fetch(githubUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (response.ok) {
      const json = await response.json();
      const content = Buffer.from(json.content, 'base64').toString('utf8');
      let parsed;
      try { parsed = JSON.parse(content); } catch { parsed = { weekKey: null, bookings: {} }; }
      return { sha: json.sha, data: parsed };
    }
    if (response.status === 404) {
      return { sha: null, data: { weekKey: null, bookings: {} } };
    }
    throw new Error('Failed to fetch from GitHub');
  }

  // Apply the mutation against the freshest data and commit. If GitHub rejects
  // the write because the file moved under us (a simultaneous booking), re-read
  // and re-apply. The mutation is re-run each attempt so an "already booked"
  // check always sees the latest state.
  async function saveWithRetry(mutate, message) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const { sha, data } = await readData();
      const working = withCurrentWeek(data);
      const outcome = mutate(working); // may throw a fail() to reject the request
      const encoded = Buffer.from(JSON.stringify(working, null, 2)).toString('base64');

      const saveResponse = await fetch(githubUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, content: encoded, sha })
      });

      if (saveResponse.ok) return { data: working, outcome };
      if (saveResponse.status === 409) continue; // SHA conflict, retry
      const error = await saveResponse.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to save');
    }
    throw fail(503, 'The booking sheet is busy, please try again.');
  }

  try {
    if (req.method === 'GET') {
      const { data } = await readData();
      const fresh = withCurrentWeek(data);
      return res.status(200).json({
        weekKey: fresh.weekKey,
        bookings: fresh.bookings,
        schedule: SCHEDULE
      });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const type = body.type;

      if (type === 'book') {
        const key = String(body.key || '');
        const name = sanitiseName(body.name);
        if (!validKeys.has(key)) throw fail(400, 'Unknown court slot.');
        if (!name) throw fail(400, 'Please enter your name to book.');

        const { data } = await saveWithRetry((working) => {
          if (working.bookings[key]) {
            throw fail(409, 'Sorry, that slot has just been booked.');
          }
          working.bookings[key] = { name, at: new Date().toISOString() };
          return { key };
        }, `Court booking: ${key}`);

        return res.status(200).json({ success: true, weekKey: data.weekKey, bookings: data.bookings });
      }

      if (type === 'cancel' || type === 'clear') {
        if (!ADMIN_PASSWORD) {
          return res.status(500).json({ error: 'Server is missing ADMIN_PASSWORD configuration' });
        }
        if (body.password !== ADMIN_PASSWORD) {
          return res.status(401).json({ error: 'Incorrect password' });
        }

        if (type === 'cancel') {
          const key = String(body.key || '');
          if (!validKeys.has(key)) throw fail(400, 'Unknown court slot.');
          const { data } = await saveWithRetry((working) => {
            delete working.bookings[key];
            return { key };
          }, `Admin cleared booking: ${key}`);
          return res.status(200).json({ success: true, weekKey: data.weekKey, bookings: data.bookings });
        }

        const { data } = await saveWithRetry((working) => {
          working.bookings = {};
          return { cleared: true };
        }, 'Admin cleared all court bookings');
        return res.status(200).json({ success: true, weekKey: data.weekKey, bookings: data.bookings });
      }

      throw fail(400, 'Invalid request type.');
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    if (error && error.httpStatus) {
      return res.status(error.httpStatus).json({ error: error.message });
    }
    console.error('Function error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
