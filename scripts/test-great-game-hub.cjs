const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...args) { return resolve.call(this, request.startsWith('@/') ? path.join(process.cwd(), request.slice(2)) : request, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { createGame } = require('../lib/the-great-game/engine.ts');
const { spectatorSnapshot } = require('../lib/the-great-game/spectator.ts');
const state = createGame();
state.pendingEffect = { id:'secret-choice',controllerId:'player1',sourceUnitInstanceId:null,abilityId:'veiled-sight' };
state.players.player1.hand = [{ instanceId:'private-hand-a',cardId:'private-card-a',costModifiers:[] }];
state.players.player2.hand = [{ instanceId:'private-hand-b',cardId:'private-card-b',costModifiers:[] }];
state.players.player1.deck = ['private-deck-a']; state.players.player2.deck = ['private-deck-b'];
state.log = [
  {id:1,turn:1,playerId:'player1',visibility:'owner',message:'private-log-a'},
  {id:2,turn:1,playerId:'player2',visibility:'owner',message:'private-log-b'},
  {id:3,turn:1,playerId:'player1',message:'Drew Legacy Secret. (2 cards remain in deck)'},
  {id:4,turn:1,playerId:'player2',message:'As I Was Saying reduces Legacy Secret cost by 1 Command'},
  {id:5,turn:1,visibility:'public',message:'Public table action'},
];
const original = structuredClone(state);
const snapshot = spectatorSnapshot(state);
assert.deepEqual(state, original, 'Projection must not mutate authoritative state');
assert.equal(snapshot.players.player1.handCount,1);
assert.equal(snapshot.players.player2.deckCount,1);
assert.deepEqual(snapshot.log.map(row=>row.id),[5]);
assert(!JSON.stringify(snapshot).match(/private-|Legacy Secret|secret-choice/));
assert(!('hand' in snapshot.players.player1));
assert(!('deck' in snapshot.players.player2));
assert(!('pendingEffect' in snapshot));

// Exercise route authorization with controlled clients; never contact a live project.
let user = {id:'11111111-1111-4111-8111-111111111111'};
const host = '22222222-2222-4222-8222-222222222222';
const guest = '33333333-3333-4333-8333-333333333333';
const matchId = '44444444-4444-4444-8444-444444444444';
let friend = true, blocked = false, matchStatus = 'active', inserted = null;
function query(result) { const q = new Proxy({}, { get(_target,key) { if (key === 'then') return (resolve)=>Promise.resolve(result).then(resolve); return ()=>q; } }); return q; }
const client = {
  auth:{getUser:async()=>({data:{user}})},
  rpc:async()=>blocked ? {data:null,error:{message:'blocked'}} : {data:'55555555-5555-4555-8555-555555555555',error:null},
  from(table) {
    if (table === 'member_friendships') return query({data:friend?[{requester_id:user.id,recipient_id:host}]:[],error:null});
    if (table === 'profiles') return query({data:[{id:host,display_name:'Host'},{id:guest,display_name:'Guest'}],error:null});
    if (table === 'direct_raven_messages') return {insert(value){inserted=value;return query({data:{id:'message-id'},error:null});}};
    throw Error(table);
  }
};
const admin = {from(table) {
  if(table==='great_game_matches')return query({data:{id:matchId,host_id:host,guest_id:guest,status:matchStatus,version:3,state,code:'ABC123'},error:null});
  if(table==='direct_raven_blocks')return query({data:blocked?[{blocker_id:host,blocked_id:user.id}]:[],error:null});
  throw Error(table);
}};
const load = Module._load;
Module._load = function(request, parent, isMain) {
  if(request==='@/lib/supabase/server')return {createClient:async()=>client};
  if(request==='@/lib/supabase/admin')return {createAdminClient:()=>admin};
  return load.call(this,request,parent,isMain);
};
const spectate = require('../app/api/great-game/spectate/route.ts');
const invite = require('../app/api/great-game/invite/route.ts');
(async()=>{
  const request = new Request(`http://localhost/api/great-game/spectate?match=${matchId}`);
  let response=await spectate.GET(request); assert.equal(response.status,200); assert(!(JSON.stringify(await response.json()).includes('private-')));
  friend=false;assert.equal((await spectate.GET(request)).status,403);
  friend=true;blocked=true;assert.equal((await spectate.GET(request)).status,403);
  blocked=false;user=null;assert.equal((await spectate.GET(request)).status,401);
  user={id:guest};matchStatus='waiting';
  const invitation=()=>new Request('http://localhost/api/great-game/invite',{method:'POST',body:JSON.stringify({matchId,username:'rival',message:'A friendly rematch?'})});
  assert.equal((await invite.POST(invitation())).status,409,'Only the host may invite');
  user={id:host};blocked=true;assert.equal((await invite.POST(invitation())).status,403,'Blocks must be honored');
  blocked=false;assert.equal((await invite.POST(invitation())).status,200);
  assert.equal(inserted.body,'A friendly rematch?\n[[game:ABC123]]');assert.equal(inserted.sender_id,host);
  matchStatus='active';assert.equal((await invite.POST(invitation())).status,409,'Expired invitations cannot be sent');
  console.log('PASS: spectator privacy, friendship/block checks, signed-out access, invitation ownership and Raven encoding');
})().catch(error=>{console.error(error);process.exitCode=1});
