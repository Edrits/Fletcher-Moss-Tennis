// Pure sign-up logic, shared by api/signup.js and the browser test harness.
//
// Deliberately free of Node APIs, fetch and Date.now() so every function can be driven
// from a test with a fixed clock. Vercel ignores any path segment starting with an
// underscore, so this file is a module rather than an endpoint.
//
// One session is live at a time. It opens the night before, fills, is played, and is
// reset when the next one opens. There is no advance booking beyond that, which is why
// there is no date-keyed map here.

// The club's fixed weekly schedule, mirroring the cards in index.html.
// day: 0 = Sunday ... 6 = Saturday
export const SCHEDULE = [
  { day: 1, label: 'Monday 6:00 to 8:00 PM',       endHour: 20 },
  { day: 4, label: 'Thursday 6:00 to 8:00 PM',     endHour: 20 },
  { day: 6, label: 'Saturday 11:00 AM to 2:00 PM', endHour: 14 }
];

// The label for whichever club night a date falls on. Derived from the date the organiser
// actually chose, never from "the next session from now": those are different sessions the
// moment anyone opens a list more than a few days ahead, and getting it wrong prints the
// wrong day at the top of the page.
export function labelForDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('-').map(Number);
  if (!y || !m || !d) return '';
  const slot = SCHEDULE.find(s => s.day === new Date(y, m - 1, d).getDay());
  return slot ? slot.label : '';
}

// 4 courts of 4, plus 2 subs, plus a short waiting list. The waitlist cap is what stops
// a public button being used to pile junk into the list.
export const DEFAULT_CAPACITY = { main: 16, subs: 2, waitlist: 10 };

// ── Club time zone ──────────────────────────────────────────────────────────
//
// Every hour in this file is a London wall-clock hour. The club plays at 6:00 PM Didsbury
// time, not 6:00 PM UTC.
//
// This used to be built with `new Date(y, m - 1, d, hour)`, which reads the *host's* zone.
// Vercel runs functions with TZ unset, so that is UTC, and for the eight months of British
// Summer Time every session time came out an hour late: a Monday was recorded as ending at
// 20:00 UTC, which is 9:00 PM in Didsbury. The list went on saying "Open now" and went on
// taking names for an hour after everyone had gone home.
//
// Intl carries the transition dates, so this stays correct across the March and October
// clock changes without a hand-written BST rule. It is standard in browsers as well as
// Node, which keeps this module loadable by the test harness.
export const CLUB_TZ = 'Europe/London';

const LONDON_FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: CLUB_TZ, hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit'
});

// The London calendar fields for an instant.
export function londonParts(date) {
  const p = {};
  for (const { type, value } of LONDON_FORMAT.formatToParts(date)) p[type] = value;
  // en-GB with hour12:false renders midnight as "24" in some builds. Left alone that
  // would roll the day forward by one while the date fields still said today.
  return {
    year: +p.year, month: +p.month, day: +p.day,
    hour: +p.hour % 24, minute: +p.minute, second: +p.second
  };
}

// How far ahead of UTC London is at a given instant, in milliseconds: 0 in winter,
// 3600000 through British Summer Time.
function londonOffsetMs(utcMs) {
  const whole = Math.floor(utcMs / 1000) * 1000;   // the parts carry no milliseconds
  const p = londonParts(new Date(whole));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - whole;
}

// The instant at which a London clock reads the given wall-clock time.
//
// Two passes: the first offset is read from an approximate instant, the second confirms it
// against the corrected one. The two only disagree within an hour either side of a clock
// change, which is exactly where a single pass lands on the wrong side of the transition.
export function londonInstant(year, month, day, hour = 0, minute = 0) {
  const naive = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const firstPass = naive - londonOffsetMs(naive);
  return new Date(naive - londonOffsetMs(firstPass));
}

const pad2 = n => String(n).padStart(2, '0');

export const NAME_MAX = 30;

// Letters (including accented ones), spaces, hyphens and apostrophes. No digits and no
// punctuation, which keeps URLs and spam text out of a repo that is public.
// Checked per word rather than as one pattern, because a full stop has to be allowed in
// exactly one place and nowhere else.
//
// It must be allowed: the site publishes names as "Sarah J." and the box suggests
// "e.g. Ed R.", so refusing it turns members away with an error telling them to type the
// very thing that just failed. It must not be allowed loose: "example.com" contains no
// digits, so a blanket full stop would let links onto a public page and into a public repo.
const WORD = /^[\p{L}][\p{L}'’-]*$/u;      // Ed, O'Brien, Anne-Marie, Renée
const INITIAL = /^\p{L}\.$/u;              // R.  J.

function isNameShaped(name) {
  const words = name.split(' ');
  return words.length > 0 && words.every(w => WORD.test(w) || INITIAL.test(w));
}

export function isoDate(d) {
  const p = londonParts(d);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

// When a given session finishes, so a played session can stop advertising itself as open.
// Without this, Monday's list still says "Open now" on Wednesday and accepts joins.
export function sessionEndsAt(dateStr) {
  const [y, m, d] = String(dateStr || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  // Which weekday that calendar date falls on. Read in UTC purely as date arithmetic:
  // a date has the same weekday in every zone, so no conversion is involved.
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const slot = SCHEDULE.find(s => s.day === weekday);
  return slot ? londonInstant(y, m, d, slot.endHour, 0) : londonInstant(y, m, d, 23, 59);
}

// The next session that has not yet finished. A session stays current until it ends, so
// the page does not drop tonight's game at midday.
export function nextSession(now) {
  const today = londonParts(now);
  for (let offset = 0; offset < 14; offset++) {
    // Step through calendar days with UTC arithmetic, which normalises a day number past
    // the end of the month. These are date fields, not an instant, so no zone is implied.
    const stamp = new Date(Date.UTC(today.year, today.month - 1, today.day + offset));
    const y = stamp.getUTCFullYear(), m = stamp.getUTCMonth() + 1, d = stamp.getUTCDate();
    const slot = SCHEDULE.find(s => s.day === stamp.getUTCDay());
    if (!slot) continue;
    // Today only counts while it is still running, judged on the London clock.
    if (offset === 0 && now >= londonInstant(y, m, d, slot.endHour, 0)) continue;
    return { date: `${y}-${pad2(m)}-${pad2(d)}`, label: slot.label };
  }
  return null;
}

// Default opening time: 8:00 PM the night before. Returned as a Date so the caller can
// store it as an ISO string; an admin may override it per session.
export function defaultOpensAt(sessionDate) {
  const [y, m, d] = sessionDate.split('-').map(Number);
  // Day 0 rolls back into the previous month, and Date.UTC handles the year boundary
  // and leap days with it.
  return londonInstant(y, m, d - 1, 20, 0);
}

// ── Session code ────────────────────────────────────────────────────────────
//
// The sign-up endpoint is public and CORS is open, so without this anyone who finds the
// URL can take a place. The code is the door: the organiser posts it in the WhatsApp
// group when sign-up opens, and only people who are in the group can join.
//
// Four digits, because it has to be typed on a phone by thirty people at once and a
// longer string costs more in mistyped codes than it buys in strength. It is not a
// password and is not protecting anything valuable. The brake on guessing is the join
// rate limit, which is fifteen attempts per connection per hour: at that rate the ten
// thousand possibilities take about a month, and the code is rotated every session.
export const PIN_LENGTH = 4;

const PIN_SHAPE = /^\d{4}$/;

export function normalisePin(raw) {
  return String(raw ?? '').trim();
}

export function validatePin(raw) {
  return PIN_SHAPE.test(normalisePin(raw));
}

// ── The WhatsApp message ────────────────────────────────────────────────────
//
// Built here rather than in the page so there is exactly one copy of the wording, and so
// it can be tested against a fixed clock. The page cannot import this module: Vercel
// serves api/ as functions, not as static assets, so an import would work locally and
// 404 in production. The server therefore hands the finished text to the page.
export const SIGNUP_URL = 'https://www.fletchermoss-socialtennisclub.co.uk/signup.html';

// The text the organiser copies and pastes into the group. Plain, and short enough to read
// on a phone without expanding it.
//
// It deliberately states NO opening time. The club opens sign-up when it suits, sometimes
// earlier or later than planned, so a message promising "opens at 7:00 PM tonight" was
// wrong as often as it was right and set an expectation the club did not want to keep. The
// message just points people at the page with the code; the page itself is the source of
// truth for whether it is open yet. The session label is kept because that is when the
// game is played, which is fixed, not when sign-up opens.
export function shareMessage({ label, pin, url = SIGNUP_URL } = {}) {
  const session = label || 'the next session';
  const lines = [`Sign-up for ${session}.`, '', url];
  if (pin) lines.push('', `Code: ${pin}`);
  lines.push('', 'Places go in the order people tap. The code only works for this session.');
  return lines.join('\n');
}

export function normaliseName(raw) {
  // NFC first. Copying a name out of Contacts or Notes can yield the decomposed form,
  // where "Jose\u0301" is an e followed by a combining accent. The name pattern below
  // matches letters but not combining marks, so a decomposed "Jos\u00e9" was rejected with
  // "Please use letters only, no numbers or links" for a name that is nothing but letters.
  return String(raw ?? '').normalize('NFC').trim().replace(/\s+/g, ' ');
}

export function validateName(raw) {
  const name = normaliseName(raw);
  if (!name) return { ok: false, error: 'Please enter a name.' };
  if (name.length > NAME_MAX) return { ok: false, error: `Names must be ${NAME_MAX} characters or fewer.` };
  if (!isNameShaped(name)) return { ok: false, error: 'Please use letters only, no numbers or links.' };
  return { ok: true, name };
}

// Capitalises the first letter, and folds the rest ONLY when the whole word was typed in
// capitals, so "JOHN" becomes "John" without also turning "O'Brien" into "O'brien" or
// "McDonald" into "Mcdonald". Names carry internal capitals that are not mistakes.
const titleCase = w => {
  if (!w) return w;
  const isShouting = w === w.toLocaleUpperCase() && w !== w.toLocaleLowerCase();
  const tail = isShouting ? w.slice(1).toLocaleLowerCase() : w.slice(1);
  return w[0].toLocaleUpperCase() + tail;
};

// "John Smith" becomes "John S.", which is what goes on a public list. Anything after the
// first word is reduced to a single initial, so only a first name is ever published.
export function shortenName(raw) {
  const name = normaliseName(raw);
  if (!name) return '';
  const parts = name.split(' ');
  const first = titleCase(parts[0]);
  if (parts.length === 1) return first;
  const initial = parts[parts.length - 1][0].toLocaleUpperCase();
  return `${first} ${initial}.`;
}

// Two members can easily shorten to the same thing. Duplicates are not merely untidy: the
// pairings tool matches players by name string (pairings.html renamePlayerOnFly), so two
// identical names would be renamed and swapped as if they were one person.
export function disambiguate(display, existingNames = []) {
  const taken = new Set(existingNames.map(n => n.toLowerCase()));
  if (!taken.has(display.toLowerCase())) return display;
  // Bounded by the list size rather than a magic number, and deliberately free of
  // Date.now() so this function stays reproducible under a fixed clock like the rest
  // of the module.
  for (let n = 2; n <= existingNames.length + 2; n++) {
    const candidate = `${display}${n}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return `${display}${existingNames.length + 2}`;
}

export function totalSlots(capacity = DEFAULT_CAPACITY) {
  return capacity.main + capacity.subs + capacity.waitlist;
}

// `position` is 1-based, as shown to members.
export function tierFor(position, capacity = DEFAULT_CAPACITY) {
  if (position <= capacity.main) return 'main';
  if (position <= capacity.main + capacity.subs) return 'sub';
  if (position <= totalSlots(capacity)) return 'waitlist';
  return 'overflow';
}

// The order of `entries` IS the queue. Keeping one ordered list means removing anyone
// promotes everybody below them with no extra bookkeeping, which is exactly the cascade
// the club already runs by hand: next in line becomes a sub, sub 1 becomes main 16.
export function splitEntries(entries = [], capacity = DEFAULT_CAPACITY) {
  const m = capacity.main;
  const s = capacity.main + capacity.subs;
  const w = totalSlots(capacity);
  return {
    main: entries.slice(0, m),
    subs: entries.slice(m, s),
    waitlist: entries.slice(s, w),
    overflow: entries.slice(w)
  };
}

// Shape the state for the page.
//
// Cancel tokens are NEVER included in the response. They are the only thing standing
// between a visitor and cancelling someone else's place, and this endpoint is public.
// Instead the caller passes its own token and gets a `mine` flag back, so a browser can
// recognise its own sign-up without learning anybody else's.
export function viewModel({ meta = {}, entries = [], now, myToken = null }) {
  const capacity = meta.capacity || DEFAULT_CAPACITY;
  const parsed = meta.opensAt ? new Date(meta.opensAt) : null;
  // An unparseable opening time must hold the button shut, not swing it open. Comparing
  // against an Invalid Date is always false, so this has to be checked explicitly.
  const opensAtValid = parsed && !Number.isNaN(parsed.getTime());

  let state = meta.state || 'pending';
  if (state === 'open' && meta.opensAt && !opensAtValid) state = 'pending';
  else if (state === 'open' && opensAtValid && now < parsed) state = 'pending';

  // A session that has been played is over, whether or not anyone remembered to reset it.
  // Otherwise Monday's list still reads "Open now" on Wednesday, and a tap lands somebody
  // on the waiting list for a game that already happened.
  const endsAt = meta.endsAt ? new Date(meta.endsAt) : null;
  if (endsAt && !Number.isNaN(endsAt.getTime()) && now >= endsAt) state = 'closed';

  const decorate = (e, i) => ({
    position: i + 1,
    name: e.name,
    mine: !!myToken && e.token === myToken
  });
  const decorated = entries.map(decorate);
  const groups = splitEntries(decorated, capacity);

  const mineIndex = entries.findIndex(e => myToken && e.token === myToken);
  const you = mineIndex === -1 ? null : {
    position: mineIndex + 1,
    tier: tierFor(mineIndex + 1, capacity)
  };

  return {
    state,
    date: meta.date || null,
    label: meta.label || null,
    opensAt: meta.opensAt || null,
    // Whether a code is needed, NEVER the code. This response is public and is cached at
    // the edge, so the value itself must never appear in it. Sessions opened before codes
    // existed have none and stay joinable without one.
    pinRequired: Boolean(meta.pin),
    // Whoever is running the session, so the page can mark them at the top of the list.
    organiser: meta.organiser || null,
    serverTime: now.toISOString(),
    capacity,
    counts: {
      total: entries.length,
      main: groups.main.length,
      subs: groups.subs.length,
      waitlist: groups.waitlist.length,
      // Should always be zero, since the join script caps the list. Reported rather than
      // dropped so that a total which disagrees with the rows on screen is visible instead
      // of silent, if a capacity reduction ever strands someone past the last slot.
      overflow: groups.overflow.length
    },
    main: groups.main,
    subs: groups.subs,
    waitlist: groups.waitlist,
    overflow: groups.overflow,
    you
  };
}
