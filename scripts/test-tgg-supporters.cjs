const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),path=require('node:path');
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.join(process.cwd(),request.slice(2)):request,...args)};
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);
const {assignSupporters,playerSupporter}=require('../lib/the-great-game/supporters.ts');
const {createGame,applyAction}=require('../lib/the-great-game/engine.ts');
const {projectGameStateForPlayer}=require('../lib/the-great-game/online.ts');
assert.deepEqual(assignSupporters(()=>0),{player1:'mara',player2:'aldren'});
assert.deepEqual(assignSupporters(()=>.99),{player1:'aldren',player2:'mara'});
let state=createGame();const assigned=structuredClone(state.supporters);
assert.notEqual(assigned.player1,assigned.player2);
for(let i=0;i<2;i++){const result=applyAction(state,{type:'mulligan',replaceHandInstanceIds:[]});assert(result.ok,result.error);state=result.state;assert.deepEqual(state.supporters,assigned);}
for(const viewer of ['player1','player2'])assert.deepEqual(projectGameStateForPlayer(JSON.parse(JSON.stringify(state)),viewer).supporters,assigned);
assert.equal(playerSupporter({...state,supporters:undefined},'player2'),'aldren');
(async()=>{
 const {PGlite}=require('@electric-sql/pglite');const db=new PGlite();
 await db.exec("create role anon; create role authenticated; create table great_game_matches(id int primary key, host_id text, state jsonb); create table great_game_match_results(match_id int,user_id text,result text);");
 await db.exec(fs.readFileSync('supabase/migrations/20261003180000_great_game_supporter_stats.sql','utf8'));
 await db.exec(`insert into great_game_matches values(1,'host','{"supporters":{"player1":"mara","player2":"aldren"}}'),(2,'host','{}'),(3,'host','{"supporters":{"player1":"mara","player2":"aldren"}}'); insert into great_game_match_results values(1,'host','win'),(1,'guest','loss'),(2,'host','win'),(3,'host','loss'),(3,'guest','win');`);
 const {rows}=await db.query('select * from great_game_supporter_stats order by user_id');
 assert.equal(rows.length,2);for(const r of rows){assert.equal(r.games_played,2);assert.equal(Number(r.win_rate),50)}
 assert.equal(rows[0].supporter,'aldren');assert.equal(rows[1].supporter,'mara');
 await db.exec('set role anon');assert.equal((await db.query('select * from great_game_supporter_stats')).rows.length,2);await db.exec('reset role');
 await db.exec("insert into great_game_matches values(4,'host','{\"supporters\":{\"player1\":\"aldren\",\"player2\":\"mara\"}}');insert into great_game_match_results values(4,'host','abandon'),(4,'guest','win');");
 const abandoned=(await db.query("select * from great_game_supporter_stats where user_id='host' and supporter='aldren'")).rows[0];assert.equal(abandoned.abandons,1);assert.equal(Number(abandoned.win_rate),0);
 await db.close();console.log('Supporters: opposite assignment, stable actions/reload/projection, legacy exclusion, per-player SQL win rates and public read access passed.');
})().catch(e=>{console.error(e);process.exit(1)});
