// Court booking backend for the singles court-booking grid on singles-league.html.
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
// Booking a slot is public; cancelling or clearing needs the admin password.
import { checkAdminPassword } from './_lib/admin-auth.js';
import { readRepoJson, updateRepoJson, repoHandler, httpError } from './_lib/repo-json.js';

const DATA_FILE = 'bookings.json';

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

// Apply a change to the current week's bookings and commit it. A stale week is
// blanked before the change, which is how the Sunday reset gets committed.
async function saveBookings(mutate, message) {
  return updateRepoJson(DATA_FILE, data => {
    const working = withCurrentWeek(data);
    mutate(working);
    return working;
  }, message);
}

export default repoHandler(async (req, res) => {
  if (req.method === 'GET') {
    const { data } = await readRepoJson(DATA_FILE);
    const fresh = withCurrentWeek(data);
    return res.status(200).json({
      weekKey: fresh.weekKey,
      bookings: fresh.bookings,
      schedule: SCHEDULE
    });
  }

  const body = req.body || {};
  const type = body.type;

  if (type === 'book') {
    const key = String(body.key || '');
    const name = sanitiseName(body.name);
    if (!validKeys.has(key)) throw httpError(400, 'Unknown court slot.');
    if (!name) throw httpError(400, 'Please enter your name to book.');

    const data = await saveBookings((working) => {
      if (working.bookings[key]) {
        throw httpError(409, 'Sorry, that slot has just been booked.');
      }
      working.bookings[key] = { name, at: new Date().toISOString() };
    }, `Court booking: ${key}`);

    return res.status(200).json({ success: true, weekKey: data.weekKey, bookings: data.bookings });
  }

  if (type === 'cancel' || type === 'clear') {
    const denied = await checkAdminPassword(req, body.password);
    if (denied) return res.status(denied.status).json({ error: denied.error });

    if (type === 'cancel') {
      const key = String(body.key || '');
      if (!validKeys.has(key)) throw httpError(400, 'Unknown court slot.');
      const data = await saveBookings((working) => {
        delete working.bookings[key];
      }, `Admin cleared booking: ${key}`);
      return res.status(200).json({ success: true, weekKey: data.weekKey, bookings: data.bookings });
    }

    const data = await saveBookings((working) => {
      working.bookings = {};
    }, 'Admin cleared all court bookings');
    return res.status(200).json({ success: true, weekKey: data.weekKey, bookings: data.bookings });
  }

  throw httpError(400, 'Invalid request type.');
});
