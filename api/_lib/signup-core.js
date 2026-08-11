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

// 4 courts of 4, plus 2 subs, plus a short waiting list. The waitlist cap is what stops
// a public button being used to pile junk into the list.
export const DEFAULT_CAPACITY = { main: 16, subs: 2, waitlist: 10 };

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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// When a given session finishes, so a played session can stop advertising itself as open.
// Without this, Monday's list still says "Open now" on Wednesday and accepts joins.
export function sessionEndsAt(dateStr) {
  const [y, m, d] = String(dateStr || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  const day = new Date(y, m - 1, d);
  const slot = SCHEDULE.find(s => s.day === day.getDay());
  return new Date(y, m - 1, d, slot ? slot.endHour : 23, slot ? 0 : 59, 0, 0);
}

// The next session that has not yet finished. A session stays current until it ends, so
// the page does not drop tonight's game at midday.
export function nextSession(now) {
  for (let offset = 0; offset < 14; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const slot = SCHEDULE.find(s => s.day === d.getDay());
    if (!slot) continue;
    if (offset === 0) {
      const endsAt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), slot.endHour);
      if (now >= endsAt) continue;
    }
    return { date: isoDate(d), label: slot.label };
  }
  return null;
}

// Default opening time: 8:00 PM the night before. Returned as a Date so the caller can
// store it as an ISO string; an admin may override it per session.
export function defaultOpensAt(sessionDate) {
  const [y, m, d] = sessionDate.split('-').map(Number);
  return new Date(y, m - 1, d - 1, 20, 0, 0, 0);
}

export function normaliseName(raw) {
  return String(raw ?? '').trim().replace(/\s+/g, ' ');
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
