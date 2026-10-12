require('./test-great-game-decks.cjs');
const assert=require('node:assert/strict'),Module=require('node:module');
const {createTestDeck}=require('../lib/the-great-game/deck.ts');
const {getAllGameCards}=require('../lib/the-great-game/cards.ts');
let user={id:'host'},table=null,updates=[],signedIn=true,rows=[],rangeCalls=[],collectionError=false;
const profiles=[{id:'host',username:'host',display_name:'Host'},{id:'guest',username:'guest',display_name:'Guest'}];
function query(name){let payload=null,operation='read',single=false,range=[0,499],filters=[];const q={
 select(){return q},insert(value){operation='insert';payload=value;return q},update(value){operation='update';payload=value;updates.push(value);return q},eq(k,v){filters.push([k,v]);return q},in(){return q},is(){return q},or(){return q},order(){return q},limit(){return q},range(a,b){range=[a,b];rangeCalls.push(range);return q},maybeSingle(){single=true;return q},single(){single=true;return q},
 then(done){let data=null,error=null;
 if(name==='great_game_matches'){
  if(operation==='insert')table={id:'match',guest_id:null,state:null,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),completed_at:null,...payload};
  if(operation==='update'&&filters.some(([k,v])=>k==='id'&&v===table?.id))table={...table,...payload};
  data=single?table:table?[table]:[];
 }else if(name==='profiles')data=profiles;
 else if(name==='great_game_collection'){assert(filters.some(([k,v])=>k==='user_id'&&v===user.id),'account-scoped ownership');data=rows.slice(range[0],range[1]+1);if(collectionError)error={message:'failure'};}
 else data=[];
 return Promise.resolve({data,error}).then(done);
 }};return q;}
const client={auth:{getUser:async()=>({data:{user:signedIn?user:null}})},from:query};
const originalLoad=Module._load;
Module._load=function(request,...args){if(request==='@/lib/supabase/server')return{createClient:async()=>client};if(request==='@/lib/supabase/admin')return{createAdminClient:()=>client};if(request==='next/server'){const next=originalLoad.call(this,request,...args);return{...next,after:()=>{}};}return originalLoad.call(this,request,...args)};
const {POST,GET}=require('../lib/server-api/great-game/handler.ts');const {GET:collection}=require('../lib/server-api/great-game/collection/handler.ts');
const post=body=>POST(new Request('http://localhost/api/great-game',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
(async()=>{
 for(const type of['custom','ranked',undefined]){
  user={id:'host'};const response=await post({op:'create',matchType:type,deck:createTestDeck()});assert.equal(response.status,201);assert.equal(table.match_type,type??'ranked');assert.equal((await response.json()).match.matchType,type??'ranked');
  const preview=await GET(new Request('http://localhost/api/great-game?code='+table.code));assert.deepEqual(await preview.json(),{matchType:type??'ranked'});
  user={id:'guest'};const joined=await post({op:'join',code:table.code,deck:createTestDeck(),matchType:type==='custom'?'ranked':'custom'});assert.equal(joined.status,200);const view=(await joined.json()).match;assert.equal(view.matchType,type??'ranked');assert.equal(table.match_type,type??'ranked');assert(!('match_type' in updates.at(-1)),'Join request cannot override type');
 }
 for(const invalid of['bogus',null,1])assert.equal((await post({op:'create',matchType:invalid})).status,400);
 assert.equal((await post({op:'create',matchType:'custom',deck:[]})).status,400);
 signedIn=false;assert.equal((await post({op:'create',matchType:'custom'})).status,401);assert.equal((await collection()).status,401);signedIn=true;
 const card=getAllGameCards()[0];rows=[{card_id:card.id,quantity:2},{card_id:'missing-card',quantity:10}];let response=await collection();assert.equal(response.status,200);assert.match(response.headers.get('Cache-Control'),/no-store/);assert.deepEqual(await response.json(),{userId:user.id,quantities:{[card.id]:2}});
 rows=Array.from({length:501},()=>({card_id:card.id,quantity:1}));rangeCalls=[];await collection();assert.deepEqual(rangeCalls,[[0,499],[500,999]]);
 rows=[];assert.deepEqual((await(await collection()).json()).quantities,{});collectionError=true;assert.equal((await collection()).status,503);
 console.log('PASS authenticated match create/join, persisted types, legacy default, no join override, invalid decks/types, invitation classification, account-only collection API, pagination/error/empty states.');
})().catch(e=>{console.error(e);process.exitCode=1});
