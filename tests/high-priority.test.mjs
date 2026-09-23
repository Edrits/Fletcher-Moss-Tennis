import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import vm from 'node:vm';
import { validatePairings } from '../api/_lib/pairings-core.js';

const run = promisify(execFile);
const binary = process.env.FMST_REDIS_SERVER;
let server, temporary, socket;
const redis = async parts => JSON.parse((await run(binary.replace(/redis-server$/, 'redis-cli'), ['-s', socket, '--json', ...parts.map(String)])).stdout);
const storeURL = 'https://redis.invalid';
process.env.KV_REST_API_URL = storeURL;
process.env.KV_REST_API_TOKEN = 'test-only';
process.env.ADMIN_PASSWORD = 'test-only';
process.env.GIT_TOKEN = 'test-only';
const { signupStore, admission, sessionIdentity } = await import('../api/_lib/signup-store.js');
const { default: signup } = await import('../api/signup.js');
const { default: pairings } = await import('../api/pairings.js');
const { archiveSession } = await import('../api/_lib/archive.js');
const originalFetch = globalThis.fetch;
let archives, githubWrites, archiveHook, failArchive;
globalThis.fetch = async (url, options = {}) => {
  if (url === storeURL) {
    const parts = JSON.parse(options.body);
    let result = await redis(parts);
    // redis-cli JSON renders HGETALL as an object; the REST client expects RESP2 pairs.
    if (parts[0] === 'HGETALL' && !Array.isArray(result)) result = Object.entries(result).flat();
    return { ok: true, json: async () => ({ result }) };
  }
  assert.match(String(url), /^https:\/\/api.github.com\/repos\/Edrits\/Fletcher-Moss-Tennis\/contents\//);
  if (failArchive) return { ok: false, status: 503, json: async () => ({ message: 'Test outage' }) };
  if (options.method !== 'PUT') {
    const content = archives.get(url);
    return { ok: !!content, status: content ? 200 : 404, json: async () => ({ content, sha: 'mock' }) };
  }
  if (archiveHook) await archiveHook();
  githubWrites++;
  const body = JSON.parse(options.body);
  if (archives.has(url)) return { ok: false, status: 422, json: async () => ({ message: 'Already exists' }) };
  archives.set(url, body.content);
  return { ok: true, status: 201, json: async () => ({}) };
};

before(async () => {
  if (!binary) return;
  temporary = await mkdtemp(join(tmpdir(), 'fmst-regression-'));
  socket = join(temporary, 'redis.sock');
  server = spawn(binary, ['--port','0','--unixsocket',socket,'--save','','--appendonly','no','--dir',temporary]);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Redis did not start')), 10000);
    server.once('error', reject);
    server.stdout.on('data', data => { if (String(data).includes('ready to accept connections') || String(data).includes('Ready to accept connections')) { clearTimeout(timeout); resolve(); } });
    server.once('exit', code => { clearTimeout(timeout); reject(new Error('Redis exited: ' + code)); });
  });
});
beforeEach(async () => {
  archives = new Map(); githubWrites = 0; archiveHook = null; failArchive = false;
  if (binary) await redis(['FLUSHDB']); // This socket belongs only to the disposable server above.
});
after(async () => {
  globalThis.fetch = originalFetch;
  if (server && server.exitCode === null) { const done = new Promise(resolve => server.once('exit',resolve)); server.kill(); await done; }
  if (temporary) await rm(temporary, {recursive:true,force:true});
});

const cap = {main:16,subs:2,waitlist:10};
const meta = generation => ({generation,date:'2099-09-07',state:'open',opensAt:'2000-01-01T00:00:00.000Z',
  endsAt:'2099-09-07T20:00:00.000Z',pin:'1234',capacity:JSON.stringify(cap)});
async function initialise(value = meta('session-A')) {
  await redis(['HSET','fm:signup:meta',...Object.entries(value).flat()]); return value;
}
async function request(handler, body) {
  const result = {};
  const res = {setHeader(){},status(code){result.status=code;return this;},json(data){result.data=data;return data;}};
  await handler({method:body ? 'POST':'GET',headers:{},body},res);
  return result;
}
const member = (sessionId='session-A', token='member-a') => ({action:'join',sessionId,token,name:'Alex Person',pin:'1234'});
const admin = body => ({password:'test-only',sessionId:'session-A',...body});
const integration = (name, fn) => test(name,{skip:!binary},fn);

integration('an acknowledged join is in the frozen archive; joins and leaves during archiving are refused', async () => {
  await initialise(); assert.equal((await request(signup,member())).data.ok,true);
  let release, entered;
  const paused = new Promise(r=>release=r), started = new Promise(r=>entered=r);
  archiveHook = async () => { entered(); await paused; };
  const resetting = request(signup,admin({action:'reset'})); await started;
  assert.equal((await request(signup,member('session-A','late'))).data.error,'transitioning');
  assert.equal((await request(signup,{action:'leave',sessionId:'session-A',token:'member-a'})).data.error,'transitioning');
  assert.equal((await request(signup,admin({action:'seed',name:'Late Admin'}))).data.error, 'The organiser is updating the session. The list is safe. Please try again shortly.');
  assert.equal((await request(signup,admin({action:'remove',names:['Alex P.']}))).data.error,'transitioning');
  const view = await request(signup); assert.equal(view.data.transitioning,true); assert.equal(view.data.main.length,1);
  release(); assert.equal((await resetting).data.ok,true);
  const saved=JSON.parse(Buffer.from([...archives.values()][0],'base64'));
  assert.deepEqual(saved.players.map(p=>p.name),['Alex P.']);
  assert.equal(JSON.stringify(saved).includes('member-a'),false);
  assert.equal((await signupStore({action:'read'})).entries.length,0);
});

integration('old admission cannot write into a replacement; organiser is seated atomically', async () => {
  const a=await initialise(); const delayed=admission(a,{token:'late',name:'Late M.',pin:'1234'});
  const out=await request(signup,admin({action:'open',date:'2099-09-10',opensAt:'2099-09-09T19:00:00Z',organiser:'Ed R.'}));
  assert.equal(out.data.ok,true); assert.notEqual(out.data.sessionId,'session-A');
  assert.equal(out.data.main[0].name,'Ed R.');
  assert.equal((await signupStore(delayed)).error,'stale_session');
  assert.equal((await request(signup,member())).data.error,'stale_session');
  assert.equal((await signupStore({action:'read'})).entries.length,1);
});

integration('archive failure retains a frozen list and can resume without repeating deletion', async () => {
  await initialise(); await request(signup,member()); failArchive=true;
  assert.equal((await request(signup,admin({action:'reset'}))).status,502);
  assert.equal((await request(signup)).data.transitioning,true);
  assert.equal((await request(signup)).data.main.length,1);
  failArchive=false;
  assert.equal((await request(signup,admin({action:'resume_transition'}))).data.ok,true);
  assert.equal(githubWrites,1);
  assert.equal((await request(signup,admin({action:'resume_transition'}))).data.ok,true);
  assert.equal(githubWrites,1);
});

integration('frozen admission checks capacity, time and code inside real Lua', async () => {
  const a=await initialise();
  assert.equal((await signupStore(admission(a,{token:'a',name:'Alex P.',pin:'9999'}))).error,'bad_pin');
  const future={...a,opensAt:'2099-09-06T19:00:00Z'};await initialise(future);
  assert.equal((await signupStore(admission(future,{token:'a',name:'Alex P.',pin:'1234'}))).error,'not_open');
  assert.equal((await signupStore(admission(a,{token:'a',name:'Alex P.',pin:'1234'}))).error,'stale_session');
  const tiny={...a,capacity:JSON.stringify({main:1,subs:0,waitlist:0})};await initialise(tiny);
  assert.equal((await signupStore(admission(tiny,{token:'a',name:'Alex P.',pin:'1234'}))).position,1);
  assert.equal((await signupStore(admission(tiny,{token:'b',name:'Alex P.',pin:'1234'}))).error,'full');
});

integration('simultaneous joins remain unique and capped with suffixes', async () => {
  const a=await initialise();
  const results=await Promise.all(Array.from({length:30},(_,i)=>signupStore(admission(a,{token:'token-'+i,name:'Alex P.',pin:'1234'}))));
  assert.equal(results.filter(r=>r.position).length,28);
  assert.equal(results.filter(r=>r.error==='full').length,2);
  const state=await signupStore({action:'read'});assert.equal(new Set(state.entries.map(e=>e.name)).size,28);
});

integration('legacy sessions work after refresh, old clients fail closed, same-date edit preserves list', async () => {
  const value=meta('unused'); delete value.generation;await initialise(value);
  const id=sessionIdentity(value);
  assert.equal((await request(signup,member(undefined))).data.error,'stale_session');
  assert.equal((await request(signup,member(id))).data.ok,true);
  const edit=await request(signup,admin({sessionId:id,action:'open',date:value.date,opensAt:value.opensAt}));
  assert.equal(edit.data.edited,true);assert.equal(edit.data.main.length,1);
  assert.equal((await signupStore({action:'read'})).entries[0].token,'member-a');
});

test('archive retries are idempotent and same-day generations do not overwrite',async()=>{
  const input={date:'2099-09-07',label:'Session',capacity:cap,entries:[{name:'Alex P.',token:'secret',at:'2099-09-06'}],
    archiveId:'11111111-1111-4111-8111-111111111111',archivedAt:'2099-09-07T20:00:00Z'};
  assert.equal((await archiveSession(input)).ok,true);
  assert.equal((await archiveSession(input)).ok,true);assert.equal(githubWrites,1);
  assert.equal((await archiveSession({...input,archiveId:'22222222-2222-4222-8222-222222222222'})).ok,true);
  assert.equal(archives.size,2);
});

integration('pairings validation preserves real data, underfilled and wiped boards; rejects duplicate identities',async()=>{
  const saved=JSON.parse(await readFile(new URL('../pairings.json',import.meta.url)));
  assert.equal(validatePairings(saved),null);
  assert.ok(validatePairings({...saved,players:[...saved.players,saved.players[0]]}));
  const empty={players:[],numCourts:1,numGames:1,activeGame:0,generatedGames:[{sitters:[],courts:[[['',''],['','']]]}]};
  assert.equal(validatePairings(empty),null);
  const partial={...empty,players:[{name:'Alex P.'}],generatedGames:[{sitters:[],courts:[[['Alex P.',''],['','']]]}]};
  assert.equal(validatePairings(partial),null);
  assert.ok(validatePairings({...partial,generatedGames:[{sitters:[],courts:[[['Alex P.'],['','']]]}]}));
  assert.equal((await request(pairings,{...saved,players:[{name:'Alex'},{name:' Alex '}],password:'test-only'})).status,400);
  assert.equal(githubWrites,0);
  assert.equal((await request(pairings,{action:'verify',password:'test-only'})).status,200);
  const padded = {...partial, players:[{name:' Alex P. '}], generatedGames:[{sitters:[],courts:[[[' Alex P. ',''],['','']]]}],password:'test-only'};
  const normalised = await request(pairings,padded);
  assert.equal(normalised.status,200);
  assert.equal(normalised.data.data.players[0].name,'Alex P.');
  assert.equal(normalised.data.data.generatedGames[0].courts[0][0][0],'Alex P.');
});

test('pairings loads with denied storage and rejects duplicate generation before any save',async()=>{
  const html=await readFile(new URL('../pairings.html',import.meta.url),'utf8');
  const source=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1].replace(/        loadCurrentSession\(\);\n        getWeather\(\);\n        setInterval\(getWeather, 600000\);/,'');
  const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{style:{},textContent:'',innerHTML:'',classList:{toggle(){},add(){},remove(){}},querySelectorAll(){return []}});return nodes.get(id)};
  const saved=JSON.parse(await readFile(new URL('../pairings.json',import.meta.url)));let writes=0, lastWrite;
  const sandbox={console,URLSearchParams,location:{search:'',pathname:'/pairings.html'},history:{replaceState(){}},setTimeout,clearTimeout,setInterval(){},
    document:{getElementById:node,querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},body:node('body')},
    fetch:async(_,o={})=>{if(o.method==='POST'){writes++;lastWrite=JSON.parse(o.body);}return {ok:true,json:async()=>saved}},alert(){},prompt:()=>null};
  Object.defineProperty(sandbox,'sessionStorage',{get(){throw new Error('Storage denied')}});
  const ctx=vm.createContext(sandbox);vm.runInContext(source,ctx);
  vm.runInContext('renderGameScreen = function() {};',ctx);
  await vm.runInContext('loadCurrentSession()',ctx);assert.equal(node('game-screen').style.display,'block');
  await vm.runInContext("players=['Alex','B','C','D','Alex'].map(name=>({name,sub:false}));numCourts=1;numGames=1;generate()",ctx);
  assert.match(node('val-msg').textContent,/different name/);assert.equal(writes,0);
  vm.runInContext("rememberCredential('fake');",ctx);assert.equal(vm.runInContext('adminCredential',ctx),'fake');
  await vm.runInContext("players=['A','B','C','D','E','F'].map(name=>({name,sub:false}));numCourts=1;numGames=4;generate()",ctx);
  assert.equal(lastWrite.numCourts,1);
  assert.equal(validatePairings(lastWrite),null);
  assert.equal(lastWrite.generatedGames.length,4);
  assert.ok(lastWrite.generatedGames.every(game=>game.courts.length===1 && game.sitters.length===2));
  vm.runInContext('forgetCredential()',ctx);assert.equal(vm.runInContext('adminCredential',ctx),'');
});

integration('capacity edits preserve queue order, reject overflow and invalidate old admissions', async () => {
  const initial = await initialise();
  for (let i=0;i<6;i++) assert.equal((await request(signup,admin({action:'seed',name:'Player '+String.fromCharCode(65+i)}))).data.ok,true);
  const before = await signupStore({action:'read'});
  const stale = admission(initial,{token:'late',name:'Late P.',pin:'1234'});
  const updated = await request(signup,admin({action:'capacity',capacity:{main:3,subs:1,waitlist:2}}));
  assert.equal(updated.status,200);
  assert.deepEqual([updated.data.main.length,updated.data.subs.length,updated.data.waitlist.length],[3,1,2]);
  assert.deepEqual((await signupStore({action:'read'})).entries,before.entries);
  assert.equal((await signupStore(stale)).error,'stale_session');
  const refused = await request(signup,admin({action:'capacity',capacity:{main:2,subs:0,waitlist:0}}));
  assert.equal(refused.status,409);
  assert.equal((await signupStore({action:'read'})).meta.capacity,JSON.stringify({main:3,subs:1,waitlist:2}));
  assert.equal((await request(signup,admin({action:'capacity',capacity:{main:2.5,subs:0,waitlist:0}}))).status,400);
  assert.equal((await request(signup,{action:'capacity',sessionId:'session-A',capacity:cap})).status,401);
});
