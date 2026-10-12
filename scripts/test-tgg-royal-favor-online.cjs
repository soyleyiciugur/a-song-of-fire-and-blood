const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...args) { return resolve.call(this, request.startsWith('@/') ? path.join(process.cwd(), request.slice(2)) : request, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true}}).outputText, filename);
const {createGame,applyAction}=require('../lib/the-great-game/engine.ts');
const {projectGameStateForPlayer}=require('../lib/the-great-game/online.ts');
const {findGameCard}=require('../lib/the-great-game/cards.ts');
let state=createGame();
for(let i=0;i<2;i++){const result=applyAction(state,{type:'mulligan',replaceHandInstanceIds:[]});assert(result.ok,result.error);state=result.state;}
const snapshot=JSON.stringify(state);
const favor=state.players.player2.hand.find(c=>c.cardId==='royal-favor');assert(favor);
for(const viewer of ['player1','player2']){
 const projected=projectGameStateForPlayer(state,viewer),other=viewer==='player1'?'player2':'player1';
 assert.deepEqual(projected.players[viewer].hand,state.players[viewer].hand);
 assert.deepEqual(projected.players.player2.hand.find(c=>c.cardId==='royal-favor'),favor);
 assert(projected.players[other].hand.filter(c=>c.cardId!=='royal-favor').every(c=>c.cardId==='__great_game_hidden_card__'));
 assert(projected.players[other].deck.every(c=>c==='__great_game_hidden_card__'));
 assert.equal(projected.players.player2.hand.filter(c=>findGameCard(c.cardId)?.special!=='royal-favor').length,state.players.player2.hand.length-1);
}
assert.equal(JSON.stringify(state),snapshot);
const ended=applyAction(state,{type:'end-turn'});assert(ended.ok,ended.error);
const capped=structuredClone(ended.state);
capped.players.player2.command=10;capped.players.player2.maxCommand=10;
const overflow=applyAction(capped,{type:'play-card',handInstanceId:favor.instanceId});assert(overflow.ok,overflow.error);
assert.equal(overflow.state.players.player2.command,11);
assert.equal(overflow.state.players.player2.maxCommand,10);
assert.equal(overflow.state.players.player2.royalFavorCommand,1);
const spendState=structuredClone(overflow.state);
spendState.players.player2.hand.push({instanceId:'favor-spend-check',cardId:'crownlands-champion',costModifiers:[]});
const spent=applyAction(spendState,{type:'play-card',handInstanceId:'favor-spend-check'});assert(spent.ok,spent.error);
assert.equal(spent.state.players.player2.royalFavorCommand,0);
assert(spent.state.players.player2.command<11);
assert(overflow.state.players.player2.removedFromGame.includes('royal-favor'));
const nextRuler=applyAction(overflow.state,{type:'end-turn'});assert(nextRuler.ok,nextRuler.error);
assert.equal(nextRuler.state.players.player2.royalFavorCommand,0);
const refill=applyAction(nextRuler.state,{type:'end-turn'});assert(refill.ok,refill.error);
assert.equal(refill.state.players.player2.command,10);
const used=applyAction(ended.state,{type:'play-card',handInstanceId:favor.instanceId});assert(used.ok,used.error);
for(const viewer of ['player1','player2'])assert(!projectGameStateForPlayer(used.state,viewer).players.player2.hand.some(c=>c.cardId==='royal-favor'));
const revealed=structuredClone(state);revealed.pendingEffect={id:'sight',controllerId:'player1',sourceUnitInstanceId:null,abilityId:'veiled-sight'};
assert.deepEqual(projectGameStateForPlayer(revealed,'player1').players.player2.hand,revealed.players.player2.hand);
console.log('Royal Favor: public for both viewers, private cards hidden, owner hand intact, bonus removed after play, Veiled Sight preserved.');
for (const owner of ['player1','player2']) {
 const full=structuredClone(state);
 full.activePlayerId=owner==='player1'?'player2':'player1';
 full.players[owner].hand=Array.from({length:8},(_,i)=>({instanceId:`full-${owner}-${i}`,cardId:'crownlands-champion',costModifiers:[]}));
 full.players[owner].deck.unshift('crownlands-champion');
 const burned=applyAction(full,{type:'end-turn'});assert(burned.ok,burned.error);
 const entry=burned.state.log.find(e=>e.playerId===owner&&e.message.startsWith('Crownlands Champion is burned.'));
 assert(entry);assert.equal(entry.visibility,'public');
 for(const viewer of ['player1','player2'])assert(projectGameStateForPlayer(burned.state,viewer).log.some(e=>e.id===entry.id&&e.message===entry.message));
}
console.log('PASS both players receive public burns for either card owner.');
