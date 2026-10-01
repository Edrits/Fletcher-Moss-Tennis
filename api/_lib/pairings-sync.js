// Keeping the court pairings board in step with the session sign-up.
//
// The sign-up already has a promotion rule: when someone drops out, the first sub moves up
// and the first person on the waiting list becomes a sub. planSignupSync() applies the same
// rule to the board: the first sub takes the leaver's exact places in every game, and the
// new sub takes the places that sub had. Nobody else's games change.
//
// Used two ways, so they can never disagree:
//   - by the organiser's "Update from sign-up" button (api/pairings.js), which previews the
//     change and asks before saving;
//   - automatically, when someone leaves or is removed from the sign-up (api/signup.js),
//     but only for a board made from that same sign-up session, only before the session
//     starts, and only when every place can be handed over. Anything else is left for the
//     organiser, whose board then shows that the sign-up has changed.
import { validatePairings } from './pairings-core.js';
import { readRepoJson, updateRepoJson } from './repo-json.js';
import { signupStore, sessionIdentity } from './signup-store.js';
import { DEFAULT_CAPACITY, splitEntries, sessionStartsAt } from './signup-core.js';

export const PAIRINGS_FILE = 'pairings.json';

const key = name => String(name).trim().toLowerCase();
const presentNow = players => players.filter(p => p.name.trim() && p.left == null);
const organiser = message => ({ status: 'organiser', message, summary: [], note: [], leaving: [], map: [], unplaced: [] });

// board: the saved pairings. signed: the sign-up's main players then subs, as [{ name }].
// from: the first game to change (earlier games are kept exactly).
// Returns { status: 'unchanged' | 'apply' | 'organiser', message, summary, note, map, unplaced, board }.
export function planSignupSync(board, signed, from = 0) {
  const players = (board && board.players) || [];
  const games = (board && board.generatedGames) || [];
  if (!games.length) return organiser('There are no pairings to update yet.');
  if (!Number.isInteger(from) || from < 0 || from >= games.length) return organiser('Pick a game on the board first.');
  const names = signed.map(p => String(p.name).trim()).filter(Boolean);
  if (!names.length) return organiser('Nobody is signed up yet, so there is nothing to compare with.');

  const onSignup = new Set(names.map(key));
  const here = presentNow(players);
  const onBoard = new Set(here.map(p => key(p.name)));
  const leavers = here.filter(p => !onSignup.has(key(p.name)));
  const joiners = names.filter(n => !onBoard.has(key(n)));
  if (!leavers.length && !joiners.length) {
    return { ...organiser('The board already matches the sign-up. Nobody has dropped out or joined.'), status: 'unchanged' };
  }
  if (leavers.length > here.length / 2) {
    return organiser('Most of the board is not on the sign-up. It may be for a different session. Use Start again from the list to set up a new board instead.');
  }
  const returning = joiners.filter(n => players.some(p => key(p.name) === key(n)));
  if (returning.length) return organiser(`${returning.join(', ')} left earlier in this session. Use Change players to bring them back.`);

  // Who takes whose places. map: old name -> new name, or null if nobody can fill them.
  const map = new Map(), summary = [], note = [];
  const queue = [...joiners];
  const subs = here.filter(p => p.sub && !leavers.includes(p));
  const subPlaces = here.filter(p => p.sub && leavers.includes(p));      // subs who dropped out
  for (const gone of leavers.filter(p => !p.sub)) {
    const up = subs.shift();
    if (up) {
      map.set(gone.name, up.name); subPlaces.push(up);
      summary.push(`${up.name} moves up into ${gone.name}'s games.`); note.push(`${up.name} moved up for ${gone.name}`);
    } else if (queue.length) {
      const n = queue.shift();
      map.set(gone.name, n);
      summary.push(`${n} takes ${gone.name}'s games.`); note.push(`${n} took ${gone.name}'s place`);
    } else {
      map.set(gone.name, null);
      summary.push(`Nobody is free to take ${gone.name}'s games, so whoever is sitting out fills in.`); note.push(`${gone.name} dropped out`);
    }
  }
  subPlaces.sort((a, b) => here.indexOf(a) - here.indexOf(b));
  for (const sub of subPlaces) {
    const dropped = leavers.includes(sub);
    if (queue.length) {
      const n = queue.shift();
      map.set(sub.name, n);
      summary.push(`${n} becomes a sub and takes ${sub.name}'s ${dropped ? 'games' : 'old places'}.`);
      note.push(dropped ? `${n} became a sub for ${sub.name}` : `${n} became a sub`);
    } else {
      map.set(sub.name, null);
      if (dropped) note.push(`${sub.name} dropped out`);
    }
  }

  const leaving = leavers.map(p => p.name);
  const intro = leaving.length ? `${leaving.join(', ')} ${leaving.length === 1 ? 'has' : 'have'} dropped out of the sign-up.` : 'New people have signed up.';
  const extra = queue.length
    ? `${queue.join(', ')} also signed up, but there ${queue.length === 1 ? 'is no free place' : 'are no free places'} for ${queue.length === 1 ? 'them' : 'them all'}. Use Change players to redraw with ${queue.length === 1 ? 'them' : 'everyone'} in.`
    : null;
  if (!summary.length) return organiser([intro, extra].filter(Boolean).join(' '));

  // Someone who arrived after the first game being changed has no places to hand over there.
  const late = here.filter(p => map.has(p.name) && (p.joined ?? 0) > from);
  if (late.length) return organiser(`${late.map(p => p.name).join(', ')} only arrived after game ${from + 1}. Go to that game first, or use Change players.`);

  const nextGames = JSON.parse(JSON.stringify(games));
  const courtGames = name => nextGames.reduce((n, g) => n + g.courts.flat(2).filter(x => x === name).length, 0);
  const swap = n => (map.has(n) ? map.get(n) : n);
  for (let gi = from; gi < nextGames.length; gi++) {
    const g = nextGames[gi];
    g.sitters = g.sitters.map(swap).filter(n => n !== null);
    g.courts = g.courts.map(c => c.map(t => t.map(n => { const next = swap(n); return next === null ? '' : next; })));
    // A place nobody could fill: bring on whoever is sitting out and has played least.
    g.courts.forEach(c => c.forEach(t => t.forEach((n, i) => {
      if (n || !g.sitters.length) return;
      const pick = [...g.sitters].sort((a, b) => courtGames(a) - courtGames(b))[0];
      g.sitters = g.sitters.filter(s => s !== pick);
      t[i] = pick;
    })));
  }

  // Each replacement takes the list position (and main or sub role) of the person they
  // replace. Leavers stay on the list only if they are in a game that is being kept.
  const targets = new Set([...map.values()].filter(Boolean));
  const roster = [];
  for (const p of here) {
    if (!map.has(p.name)) { roster.push(p); continue; }
    const next = map.get(p.name);
    if (!next) continue;
    const existing = here.find(q => q.name === next);
    roster.push(existing ? { ...existing, sub: !!p.sub } : { name: next, sub: !!p.sub, ...(from > 0 ? { joined: from } : {}) });
  }
  for (const p of here) {
    if (!map.has(p.name) || targets.has(p.name)) continue;
    if (from > 0 && (p.joined ?? 0) < from) roster.push({ ...p, left: from });
  }
  roster.push(...players.filter(p => p.name.trim() && p.left != null));

  const next = { ...board, players: roster, generatedGames: nextGames };
  const invalid = validatePairings(next);
  if (invalid) return organiser(`The board could not be updated from the sign-up: ${invalid}`);
  return {
    status: 'apply', message: [intro, ...summary, extra].filter(Boolean).join(' '),
    summary: [intro, summary.join('\n'), extra].filter(Boolean), note, leaving,
    map: [...map.entries()], unplaced: queue, board: next
  };
}

function capacityOf(meta) {
  try {
    const cap = JSON.parse(meta.capacity || 'null');
    if (cap && ['main', 'subs', 'waitlist'].every(k => Number.isInteger(cap[k]) && cap[k] >= 0)) return cap;
  } catch { /* fall back to the default */ }
  return DEFAULT_CAPACITY;
}

// The live sign-up: its session identity and date, and who holds a main or sub place.
// The waiting list is left out; those people are not expected to turn up.
export async function readSignupPlayers() {
  const { meta = {}, entries = [], transitioning } = await signupStore({ action: 'read' });
  const groups = splitEntries(entries, capacityOf(meta));
  return {
    id: sessionIdentity(meta), date: meta.date || null, opensAt: meta.opensAt || null, transitioning: !!transitioning,
    signed: [...groups.main.map(e => ({ name: e.name, sub: false })), ...groups.subs.map(e => ({ name: e.name, sub: true }))]
  };
}

// Does this board belong to the live sign-up session? Yes if it is stamped with it. A board
// with no stamp (made before stamping existed, or pasted in) counts as this session's if it
// was saved after this sign-up opened: a board left over from the last session was saved
// before then, so it is never mistaken for tonight's.
function followsSignup(board, signup) {
  if (!board || !(board.generatedGames || []).length) return false;
  if (board.signupSession) return board.signupSession.id === signup.id;
  const saved = Date.parse(board.updated || ''), opened = Date.parse(signup.opensAt || '');
  return Number.isFinite(saved) && Number.isFinite(opened) && saved >= opened;
}

class Skip extends Error {}

// Bring the board into line with the sign-up if it can be done safely without anyone
// checking: a board of this session, before the session starts, with every place handed
// over. A board that was never stamped is only changed for one or two dropouts, as a
// further guard. Runs when someone leaves the sign-up (api/signup.js) and whenever the
// board is opened (api/pairings.js), so a missed update is caught up on the next look.
// `known` is the board if the caller has just read it. Returns the saved board, or null.
export async function autoSyncPairings(now = new Date(), known) {
  const signup = await readSignupPlayers();
  if (signup.transitioning || !signup.date) return null;
  const starts = sessionStartsAt(signup.date);
  if (!starts || now >= starts) return null;

  const decide = board => {
    if (!followsSignup(board, signup)) return null;
    const plan = planSignupSync(board, signup.signed, 0);
    if (plan.status !== 'apply' || plan.unplaced.length) return null;
    if (!board.signupSession && plan.leaving.length > 2) return null;
    return plan;
  };
  const data = known !== undefined ? known : (await readRepoJson(PAIRINGS_FILE)).data;
  if (!decide(data)) return null;

  try {
    return await updateRepoJson(PAIRINGS_FILE, current => {
      const plan = decide(current);          // decided again on the freshest copy
      if (!plan) throw new Skip();
      return { ...plan.board, signupSession: { id: signup.id, date: signup.date },
        autoNote: { text: plan.note.join(', '), at: now.toISOString() }, updated: now.toISOString() };
    }, 'Updated court pairings from the sign-up');
  } catch (err) {
    if (err instanceof Skip) return null;
    throw err;
  }
}
