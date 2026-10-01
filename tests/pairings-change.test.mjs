// Changing players on a live pairings board: played games are kept, the rest redrawn.
// Runs the real page script in a sandbox. Needs nothing installed:
// `node --test tests/*.test.mjs`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { validatePairings } from '../api/_lib/pairings-core.js';

process.env.ADMIN_PASSWORD = 'test-only';
process.env.GIT_TOKEN = 'test-only';
process.env.KV_REST_API_URL = 'https://redis.invalid';
process.env.KV_REST_API_TOKEN = 'test-only';
// Loaded after the environment is set: it pulls in the Redis client, which reads it on import.
const { planSignupSync } = await import('../api/_lib/pairings-sync.js');

const html = await readFile(new URL('../pairings.html', import.meta.url), 'utf8');
const source = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1]
  .replace(/        loadCurrentSession\(\);\n        getWeather\(\);\n        setInterval\(getWeather, 600000\);/, '');

function page({ signup, allowAlerts = false } = {}) {
  const messages = [];
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { id, style: {}, textContent: '', innerHTML: '', value: '', hidden: false, disabled: false,
      classList: { toggle() {}, add() {}, remove() {} }, querySelectorAll: () => [], setAttribute() {}, scrollIntoView() {} });
    return nodes.get(id);
  };
  const writes = [];
  const sandbox = {
    console, URLSearchParams, JSON, Math, Set, Map,
    location: { search: '', pathname: '/pairings.html' }, history: { replaceState() {} },
    setTimeout, clearTimeout, setInterval() {}, sessionStorage: { getItem: () => '', setItem() {}, removeItem() {} },
    document: { getElementById: node, querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, body: node('body') },
    fetch: async (url, o = {}) => {
      if (String(url).includes('/api/signup')) return { ok: true, json: async () => signup };
      if (o.method === 'POST') writes.push(JSON.parse(o.body));
      return { ok: true, json: async () => ({}) };
    },
    alert(msg) { if (!allowAlerts) throw new Error('Unexpected alert: ' + msg); messages.push(msg); },
    confirm: msg => { messages.push(msg); return true; }, prompt: () => null
  };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(source, ctx);
  vm.runInContext('renderGameScreen = function() {}; boardLoaded = true; editMode = true; rememberCredential("test-only");', ctx);
  return { ctx, node, writes, messages, run: code => vm.runInContext(code, ctx) };
}

const names = n => Array.from({ length: n }, (_, i) => `P${String(i + 1).padStart(2, '0')}`);
const onCourt = game => game.courts.flat(2).filter(Boolean);
const partnerships = games => games.flatMap(g => g.courts.flatMap(c => c.filter(t => t.every(Boolean)).map(t => [...t].sort().join('|'))));

// A board as the organiser would have it: generated normally, then a big shift at game 3.
async function boardWithShift() {
  const p = page();
  p.run(`players = ${JSON.stringify(names(14).map((name, i) => ({ name, sub: i >= 12 })))}; numCourts = 3; numGames = 6;`);
  await p.run('generate()');
  const original = JSON.parse(JSON.stringify(p.run('generatedGames')));
  // Four turn up, P05 goes home, and a fourth court opens: redraw from game 3 (index 2).
  p.run(`cpOpen(); document.getElementById('cp-from').value = '2';
    cp.list.find(x => x.name === 'P05').status = 'leaving';
    ['New A', 'New B', 'New C', 'New D'].forEach(name => cp.list.push({ name, sub: false, status: 'new' }));
    cp.courts = 4;`);
  await p.run('cpApply()');
  return { p, original, saved: p.writes.at(-1) };
}

test('a big shift mid-session keeps played games and redraws the rest validly', async () => {
  const { original, saved } = await boardWithShift();
  assert.equal(validatePairings(saved), null);
  assert.deepEqual(saved.generatedGames.slice(0, 2), original.slice(0, 2), 'games 1 and 2 are untouched');
  assert.equal(saved.numCourts, 4);
  assert.equal(saved.activeGame, 2);
  assert.ok(saved.generatedGames.slice(2).every(g => g.courts.length === 4), 'redrawn games use the new court count');
  assert.ok(saved.generatedGames.slice(0, 2).every(g => g.courts.length === 3), 'played games keep theirs');

  const leaver = saved.players.find(x => x.name === 'P05');
  assert.equal(leaver.left, 2);
  for (const g of saved.generatedGames.slice(2)) assert.ok(![...g.sitters, ...onCourt(g)].includes('P05'));
  for (const name of ['New A', 'New B', 'New C', 'New D']) {
    assert.equal(saved.players.find(x => x.name === name).joined, 2);
    // Late arrivals have played least, so they go straight on court.
    assert.ok(saved.generatedGames.slice(2).every(g => onCourt(g).includes(name)), `${name} plays every redrawn game`);
  }
});

test('the redraw avoids repeating partners from the games already played', async () => {
  const { saved } = await boardWithShift();
  const all = partnerships(saved.generatedGames);
  assert.equal(new Set(all).size, all.length, 'no partnership is repeated across the session');
});

test('sit-outs even out games played among everyone who was there all session', async () => {
  const { saved } = await boardWithShift();
  const counts = {};
  saved.generatedGames.forEach(g => onCourt(g).forEach(n => { counts[n] = (counts[n] || 0) + 1; }));
  const allSession = names(14).filter(n => n !== 'P05').map(n => counts[n]);
  assert.ok(Math.max(...allSession) - Math.min(...allSession) <= 1, `spread was ${allSession}`);
});

test('redrawing from game 1 still sits the subs out first, then rotates up the list', async () => {
  const p = page();
  p.run(`players = ${JSON.stringify(names(14).map((name, i) => ({ name, sub: i >= 12 })))}; numCourts = 3; numGames = 4;`);
  await p.run('generate()');
  p.run(`cpOpen(); document.getElementById('cp-from').value = '0';`);
  await p.run('cpApply()');
  const saved = p.writes.at(-1);
  assert.equal(validatePairings(saved), null);
  assert.deepEqual(saved.generatedGames.map(g => g.sitters), [['P13', 'P14'], ['P11', 'P12'], ['P09', 'P10'], ['P07', 'P08']]);
  assert.ok(saved.players.every(x => x.joined === undefined && x.left === undefined));
});

test('someone who leaves and comes back sits out the games they missed', async () => {
  const p = page();
  p.run(`players = ${JSON.stringify(names(9).map(name => ({ name, sub: false })))}; numCourts = 2; numGames = 6;`);
  await p.run('generate()');
  p.run(`cpOpen(); document.getElementById('cp-from').value = '1'; cp.list.find(x => x.name === 'P01').status = 'leaving';`);
  await p.run('cpApply()');
  p.run(`cpOpen(); document.getElementById('cp-from').value = '4';
    document.getElementById('cp-add-name').value = 'P01'; cpAdd();`);
  await p.run('cpApply()');
  const saved = p.writes.at(-1);
  assert.equal(validatePairings(saved), null);
  const back = saved.players.find(x => x.name === 'P01');
  assert.equal(back.left, undefined);
  assert.deepEqual([1, 2, 3].map(i => saved.generatedGames[i].sitters.includes('P01')), [true, true, true]);
});

test('the sign-up comparison adds new names and marks missing ones as leaving, keeping walk-ins', async () => {
  const signup = { state: 'open', date: '2026-10-05', label: 'Monday 6:00 to 8:00 PM',
    main: names(12).filter(n => n !== 'P03').concat(['Sam K.']).map(name => ({ name })), subs: [{ name: 'P13' }], waitlist: [{ name: 'Late W.' }] };
  const p = page({ signup });
  p.run(`players = ${JSON.stringify(names(13).map((name, i) => ({ name, sub: i >= 12 })))}; numCourts = 3; numGames = 4;`);
  await p.run('generate()');
  p.run(`cpOpen(); document.getElementById('cp-add-name').value = 'Walk In'; cpAdd();`);
  await p.run('cpUseSignup()');
  const list = p.run('JSON.parse(JSON.stringify(cp.list))');
  const status = Object.fromEntries(list.map(x => [x.name, x.status]));
  assert.equal(status['Sam K.'], 'new');
  assert.equal(status['P03'], 'leaving');
  assert.equal(status['Walk In'], 'new', 'someone added by hand is not dropped');
  assert.equal(status['Late W.'], undefined, 'the waiting list is left out');
  assert.equal(status['P01'], 'stay');
});

test('server: arrivals and leavers validate; a dropped or extra player is still refused', () => {
  const game = (sitters, a, b) => ({ sitters, courts: [[a, b]] });
  const board = {
    numCourts: 1, numGames: 3, activeGame: 0,
    players: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D', left: 2 }, { name: 'E', joined: 1 }],
    generatedGames: [
      game([], ['A', 'B'], ['C', 'D']),
      game(['E'], ['A', 'B'], ['C', 'D']),
      game([], ['A', 'B'], ['C', 'E'])
    ]
  };
  assert.equal(validatePairings(board), null);
  const dropped = JSON.parse(JSON.stringify(board)); dropped.generatedGames[1].sitters = [];
  assert.ok(validatePairings(dropped), 'E missing from a game they are present for');
  const ghost = JSON.parse(JSON.stringify(board)); ghost.generatedGames[0].sitters = ['E'];
  assert.ok(validatePairings(ghost), 'E in a game before they arrived');
  assert.ok(validatePairings({ ...board, players: [...board.players.slice(0, 4), { name: 'E', joined: 3 }] }), 'joined past the last game');
  assert.ok(validatePairings({ ...board, players: [{ name: 'A', left: 0 }, ...board.players.slice(1)] }), 'left before joining');
});

test('server: saving keeps only the known player fields', async () => {
  // Same minimal Redis (for the password rate limit) and GitHub mocks as repo-handlers.test.mjs
  const redis = new Map();
  globalThis.fetch = async (url, options = {}) => {
    if (url === process.env.KV_REST_API_URL) {
      const [cmd, key] = JSON.parse(options.body);
      if (cmd === 'SET' && !redis.has(key)) redis.set(key, 0);
      if (cmd === 'INCR') redis.set(key, (redis.get(key) || 0) + 1);
      if (cmd === 'DECR') redis.set(key, (redis.get(key) || 0) - 1);
      return { ok: true, json: async () => ({ result: redis.get(key) ?? null }) };
    }
    return options.method === 'PUT'
      ? { ok: true, status: 200, json: async () => ({}) }
      : { ok: false, status: 404, json: async () => ({}) };
  };
  const { default: pairings } = await import('../api/pairings.js');
  const body = {
    password: 'test-only', numCourts: 1, numGames: 2, activeGame: 0,
    players: [{ name: 'A', sub: 0, evil: '<script>' }, { name: 'B' }, { name: 'C' }, { name: 'D', left: 1 }, { name: 'E', joined: 1, sub: true }],
    generatedGames: [
      { game: 1, sitters: [], courts: [[['A', 'B'], ['C', 'D']]] },
      { game: 2, sitters: [], courts: [[['A', 'B'], ['C', 'E']]] }
    ]
  };
  let status, data;
  const res = { setHeader() {}, status(c) { status = c; return this; }, json(d) { data = d; return this; }, end() { return this; } };
  await pairings({ method: 'POST', headers: { 'x-forwarded-for': '1.1.1.1' }, body }, res);
  assert.equal(status, 200, JSON.stringify(data));
  assert.deepEqual(data.data.players, [
    { name: 'A', sub: false }, { name: 'B', sub: false }, { name: 'C', sub: false },
    { name: 'D', sub: false, left: 1 }, { name: 'E', sub: true, joined: 1 }
  ]);
});

// ── Update from sign-up: the sign-up's promotion rule applied to the board ──
// The rule lives in api/_lib/pairings-sync.js, shared by the button and the automatic
// update. The board: P01-P12 main, P13 and P14 subs, generated by the real page.
async function signedUpBoard(signup, { games = 4, from = 0 } = {}) {
  const p = page();
  p.run(`players = ${JSON.stringify(names(14).map((name, i) => ({ name, sub: i >= 12 })))}; numCourts = 3; numGames = ${games};`);
  await p.run('generate()');
  const board = p.writes.at(-1);
  const before = JSON.parse(JSON.stringify(board.generatedGames));
  const signed = [...signup.main.map(x => ({ name: x.name, sub: false })), ...signup.subs.map(x => ({ name: x.name, sub: true }))];
  const plan = planSignupSync(board, signed, from);
  return { plan, before, saved: plan.status === 'apply' ? plan.board : null };
}
const slotsOf = (games, name) => games.map(g => [...g.sitters.map((n, i) => n === name ? `sit${i}` : null),
  ...g.courts.flat(2).map((n, i) => n === name ? `seat${i}` : null)].filter(Boolean).join(',')).join(' | ');
const signupWith = (main, subs) => ({ state: 'open', date: '2026-10-01', label: 'Thursday 6:00 to 8:00 PM',
  main: main.map(name => ({ name })), subs: subs.map(name => ({ name })), waitlist: [] });

test('a dropout: the first sub takes their exact places, the new sub takes the sub\'s, nobody else moves', async () => {
  // P12 cancelled on the sign-up: P13 moved up to main, and New X came off the waiting list.
  const signup = signupWith([...names(11), 'P13'], ['P14', 'New X']);
  const { plan, before, saved } = await signedUpBoard(signup);
  assert.equal(validatePairings(saved), null);
  assert.equal(slotsOf(saved.generatedGames, 'P13'), slotsOf(before, 'P12'));
  assert.equal(slotsOf(saved.generatedGames, 'New X'), slotsOf(before, 'P13'));
  for (const name of [...names(11), 'P14']) assert.equal(slotsOf(saved.generatedGames, name), slotsOf(before, name), `${name} is unchanged`);
  assert.equal(saved.players.find(x => x.name === 'P12'), undefined);
  assert.deepEqual(saved.players.find(x => x.name === 'P13'), { name: 'P13', sub: false });
  assert.deepEqual(saved.players.find(x => x.name === 'New X'), { name: 'New X', sub: true });
  assert.match(plan.summary.join('\n'), /P12 has dropped out[\s\S]*P13 moves up into P12's games[\s\S]*New X becomes a sub/);
  assert.deepEqual(plan.note, ['P13 moved up for P12', 'New X became a sub']);
});

test('mid-session, games already played are left exactly as they were', async () => {
  const signup = signupWith([...names(11), 'P13'], ['P14', 'New X']);
  const { before, saved } = await signedUpBoard(signup, { games: 6, from: 2 });
  assert.equal(validatePairings(saved), null);
  assert.deepEqual(saved.generatedGames.slice(0, 2), before.slice(0, 2));
  assert.equal(saved.players.find(x => x.name === 'P12').left, 2);
  assert.equal(saved.players.find(x => x.name === 'New X').joined, 2);
  assert.equal(slotsOf(saved.generatedGames.slice(2), 'P13'), slotsOf(before.slice(2), 'P12'));
});

test('with nobody on the waiting list, whoever is sitting out fills the empty place', async () => {
  const signup = signupWith([...names(11), 'P13'], ['P14']);
  const { saved } = await signedUpBoard(signup);
  assert.equal(validatePairings(saved), null);
  assert.ok(saved.generatedGames.every(g => onCourt(g).length === 12 && g.sitters.length === 1), 'every court stays full');
});

test('a sub dropping out is replaced by the new sub directly', async () => {
  const signup = signupWith(names(12), ['P13', 'New Y']);
  const { before, saved } = await signedUpBoard(signup);
  assert.equal(validatePairings(saved), null);
  assert.equal(slotsOf(saved.generatedGames, 'New Y'), slotsOf(before, 'P14'));
  assert.equal(slotsOf(saved.generatedGames, 'P13'), slotsOf(before, 'P13'));
});

test('nothing changes when the board already matches, or when the sign-up is for another session', async () => {
  const same = await signedUpBoard(signupWith(names(12), ['P13', 'P14']));
  assert.equal(same.saved, null);
  assert.equal(same.plan.status, 'unchanged');
  const other = await signedUpBoard(signupWith(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'P01', 'P02'], []));
  assert.equal(other.saved, null);
  assert.match(other.plan.message, /different session/);
});
