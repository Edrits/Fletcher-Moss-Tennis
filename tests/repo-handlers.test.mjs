// The repo-backed handlers (noticeboard, league, pairings, booking) against an in-memory
// GitHub Contents API and Redis. Needs nothing installed: run with `node --test tests/*.test.mjs`.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const storeURL = 'https://redis.invalid';
process.env.KV_REST_API_URL = storeURL;
process.env.KV_REST_API_TOKEN = 'test-only';
process.env.ADMIN_PASSWORD = 'test-only';
process.env.GIT_TOKEN = 'test-only';

let files, redis, conflictsLeft;
globalThis.fetch = async (url, options = {}) => {
  if (url === storeURL) {
    const [cmd, key] = JSON.parse(options.body);
    if (cmd === 'INCR') redis.set(key, (redis.get(key) || 0) + 1);
    return { ok: true, json: async () => ({ result: cmd === 'EXPIRE' ? 1 : (redis.get(key) ?? null) }) };
  }
  const file = url.split('/contents/')[1];
  const stored = files.get(file);
  if (options.method !== 'PUT') {
    if (!stored) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => ({ sha: stored.sha, content: Buffer.from(stored.text).toString('base64') }) };
  }
  const body = JSON.parse(options.body);
  if (conflictsLeft > 0 || (body.sha ?? null) !== (stored?.sha ?? null)) {
    conflictsLeft--;
    // Someone else saved in between: the file moves on to a new version.
    if (stored) stored.sha += '+';
    return { ok: false, status: 409, json: async () => ({ message: 'sha mismatch' }) };
  }
  files.set(file, { sha: (stored?.sha || 'v') + '1', text: Buffer.from(body.content, 'base64').toString('utf8') });
  return { ok: true, status: 200, json: async () => ({}) };
};

const { default: noticeboard } = await import('../api/noticeboard.js');
const { default: boxleague } = await import('../api/boxleague.js');
const { default: booking } = await import('../api/booking.js');

async function call(handler, method, body, ip = '1.1.1.1') {
  const req = { method, body, headers: { 'x-forwarded-for': ip } };
  let status = 200, json;
  const res = { setHeader() {}, status(s) { status = s; return this; }, json(j) { json = j; return this; }, end() { return this; } };
  await handler(req, res);
  return { status, json };
}
const read = file => JSON.parse(files.get(file).text);

beforeEach(() => {
  files = new Map();
  redis = new Map();
  conflictsLeft = 0;
  files.set('boxleague.json', { sha: 'a', text: JSON.stringify({ boxes: [{ id: 'league-1', name: 'League', players: [
    { name: 'Ann' }, { name: 'Bob' }], matches: [] }] }) });
});

test('noticeboard reads a missing file as empty and saves with the password', async () => {
  assert.deepEqual((await call(noticeboard, 'GET')).json, { message: '', updated: null });
  assert.equal((await call(noticeboard, 'POST', { password: 'nope', message: 'x' })).status, 401);
  assert.equal((await call(noticeboard, 'POST', { password: 'test-only', message: 'Hello' })).status, 200);
  assert.equal(read('noticeboard.json').message, 'Hello');
});

test('a score survives a simultaneous save instead of failing', async () => {
  conflictsLeft = 1;
  const out = await call(boxleague, 'POST', { type: 'submit_score',
    match: { boxId: 'league-1', player1: 'Ann', player2: 'Bob', winner: 'Ann', noShow: null } });
  assert.equal(out.status, 200);
  const [ann, bob] = read('boxleague.json').boxes[0].players;
  assert.deepEqual([ann.name, ann.points, bob.points], ['Ann', 3, 1]);
});

test('league rejects bad input without writing', async () => {
  assert.equal((await call(boxleague, 'POST', { type: 'submit_score' })).status, 400);
  await call(boxleague, 'POST', { type: 'submit_score',
    match: { boxId: 'league-1', player1: 'Ann', player2: 'Bob', winner: 'Bob' } });
  // A missing index used to delete the first match.
  assert.equal((await call(boxleague, 'POST', { type: 'delete_match', password: 'test-only', boxId: 'league-1' })).status, 400);
  assert.equal((await call(boxleague, 'POST', { type: 'delete_match', password: 'test-only', boxId: 'league-1', matchIndex: 5 })).status, 400);
  assert.equal(read('boxleague.json').boxes[0].matches.length, 1);
  assert.equal((await call(boxleague, 'POST', { type: 'delete_match', password: 'test-only', boxId: 'league-1', matchIndex: 0 })).status, 200);
  assert.equal(read('boxleague.json').boxes[0].matches.length, 0);
});

test('a slot cannot be booked twice', async () => {
  const key = 'mon|1|20:00';
  assert.equal((await call(booking, 'POST', { type: 'book', key, name: 'Ann' })).status, 200);
  assert.equal((await call(booking, 'POST', { type: 'book', key, name: 'Bob' })).status, 409);
  assert.equal((await call(booking, 'GET')).json.bookings[key].name, 'Ann');
});

test('wrong-password guesses are capped across every endpoint, not per endpoint', async () => {
  const ip = '2.2.2.2';
  for (let i = 0; i < 5; i++) assert.equal((await call(noticeboard, 'POST', { password: 'guess' }, ip)).status, 401);
  for (let i = 0; i < 5; i++) assert.equal((await call(booking, 'POST', { type: 'clear', password: 'guess' }, ip)).status, 401);
  // Locked out everywhere, even with the right password, until the window passes.
  assert.equal((await call(boxleague, 'POST', { type: 'delete_match', password: 'test-only', boxId: 'league-1', matchIndex: 0 }, ip)).status, 429);
  // Another connection is unaffected, and right answers never spend an attempt.
  for (let i = 0; i < 12; i++) assert.equal((await call(noticeboard, 'POST', { password: 'test-only', message: 'ok' })).status, 200);
});
