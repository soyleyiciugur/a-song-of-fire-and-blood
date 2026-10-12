require('./test-great-game-decks.cjs');
const assert=require('node:assert/strict');const {createGame,applyAction,getCardPlayFeedback,getMaximumHealth}=require('../lib/the-great-game/engine.ts');
let state=createGame();function act(action){const result=applyAction(state,action);assert(result.ok,result.error);state=result.state;}
act({type:'mulligan',replaceHandInstanceIds:[]});act({type:'mulligan',replaceHandInstanceIds:[]});state.players.player1.command=10;state.players.player1.hand=[{instanceId:'naela',cardId:'naela-targaryen',costModifiers:[]}];act({type:'play-card',handInstanceId:'naela'});
let unit=state.players.player1.board[0];const id=unit.instanceId;const full=getMaximumHealth(state,unit);assert.equal(unit.currentHealth,full);
act({type:'end-turn'});unit=state.players.player1.board.find(u=>u.instanceId===id);assert.equal(unit.currentHealth,full-1);
unit.exhausted=false;state.players.player2.command=10;for(const cardId of ['word-in-the-right-ear','brothers-tilt']){state.players.player2.hand=[{instanceId:'event',cardId,costModifiers:[]}];const feedback=getCardPlayFeedback(state,'player2','event');assert.equal(feedback.reason,null);const result=applyAction(state,{type:'play-card',handInstanceId:'event',targetInstanceId:id});assert(result.ok,result.error);}
act({type:'end-turn'});unit=state.players.player1.board.find(u=>u.instanceId===id);assert.equal(unit.currentHealth,full);unit.currentHealth=1;
act({type:'end-turn'});assert(!state.players.player1.board.some(u=>u.instanceId===id));act({type:'end-turn'});assert(!state.players.player1.board.some(u=>u.instanceId===id));
assert(!state.log.some(e=>e.message.includes('Whereabouts Unknown')));
console.log('PASS North of Tyrosh own-turn damage/heal, lethal damage without resurrection and Ready enemy Event targeting');
