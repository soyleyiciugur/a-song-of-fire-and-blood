const fs=require('fs'),path=require('path'),ts=require('typescript'),Module=require('module'),assert=require('node:assert/strict');
const root=process.cwd();const resolve=Module._resolveFilename;
Module._resolveFilename=function(name,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,...args)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {getTraitHighlights:glow}=require('../lib/the-great-game/trait-highlights.ts');
const unit=(cardId,ownerId='player1')=>({cardId,instanceId:cardId,ownerId,exhausted:false,deployedThisTurn:true,grounded:false,modifiers:[],flags:{},counters:{},attachedArtifactId:null,currentHealth:6});
const state={phase:'playing',activePlayerId:'player1',players:{player1:{board:[],hand:[]},player2:{board:[],hand:[]}}};
const rider=unit('jacaelon-targaryen');state.players.player1.board=[rider];
assert.deepEqual(glow(state,'player1',rider),['schemer']);
state.players.player1.hand=[{cardId:'jhagar'}];assert.deepEqual(glow(state,'player1',rider),['schemer','dragonrider']);
Object.defineProperty(state.players.player2,'hand',{get(){throw Error('Private opposing hand accessed')}});
assert.deepEqual(glow(state,'player2',rider),[]);
const swift=unit('gaelor-targaryen');assert(glow(state,'player1',swift).includes('swift'));swift.exhausted=true;assert.deepEqual(glow(state,'player1',swift),[]);swift.exhausted=false;swift.grounded=true;assert.deepEqual(glow(state,'player1',swift),[]);
rider.deployedThisTurn=false;state.players.player1.hand=[];assert.deepEqual(glow(state,'player1',rider),[]);
const guard=unit('tully-river-guard','player2'),intrigue=unit('reach-courtier','player2');state.players.player2.board=[guard,intrigue];
let conflict={kind:'military',attackerInstanceId:rider.instanceId};assert.deepEqual(glow(state,'player1',guard,conflict),['guard']);guard.grounded=true;assert.deepEqual(glow(state,'player1',guard,conflict),[]);guard.grounded=false;
conflict.kind='political';assert.deepEqual(glow(state,'player1',intrigue,conflict),['intrigue']);intrigue.exhausted=true;assert.deepEqual(glow(state,'player1',intrigue,conflict),[]);intrigue.exhausted=false;
for(const [id,kind,trait,target] of [['alester-dayne','military','challenge',guard],['renrose-tyrell','political','confront',intrigue]]){const attacker=unit(id);state.players.player1.board=[attacker];conflict={kind,attackerInstanceId:attacker.instanceId};assert(glow(state,'player1',attacker,conflict).includes(trait));assert.deepEqual(glow(state,'player1',target,conflict),[]);assert.deepEqual(glow(state,'player2',target,conflict),[]);}
console.log('PASS contextual traits, bypass rules, readiness, bond updates and opposing-hand privacy');

