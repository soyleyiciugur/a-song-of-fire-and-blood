const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...args) { return resolve.call(this, request.startsWith('@/') ? path.join(process.cwd(), request.slice(2)) : request, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true}}).outputText, filename);
const {chromium,expect}=require('@playwright/test');
const {createGame,applyAction}=require('../lib/the-great-game/engine.ts');
const {projectGameStateForPlayer}=require('../lib/the-great-game/online.ts');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});let state=createGame();const assigned=structuredClone(state.supporters);try{
const pages=[];const errors=[];
for(const viewer of ['player1','player2']){
 const p=await b.newPage({viewport:{width:844,height:390}});p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/api/great-game**',async route=>{const body=route.request().postDataJSON();if(body?.op==='action'){const r=applyAction(state,body.action);assert(r.ok,r.error);state=r.state;}
 const person={id:'00000000-0000-4000-8000-000000000002',username:'tester',displayName:'Tester',avatarUrl:null};const match={id:'00000000-0000-4000-8000-000000000001',code:'ABCDEF',status:'active',version:state.phase==='mulligan-player1'?1:state.phase==='mulligan-player2'?2:3,playerId:viewer,host:person,guest:person,opponent:person,state:projectGameStateForPlayer(state,viewer),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),completedAt:null};await route.fulfill({json:{match,matches:[]}});});
 await p.goto('http://localhost:3000/cards/play');await p.getByRole('button',{name:'Online Game',exact:true}).click();await p.getByRole('textbox',{name:'Table code'}).fill('ABCDEF');await p.getByRole('button',{name:'Join',exact:true}).click();await expect(p.getByRole('dialog')).toBeVisible();expect(await p.getByRole('dialog').locator('[data-table-speaker]').getAttribute('data-table-speaker')).toBe(assigned[viewer]);pages.push(p);
}
await expect(pages[1].getByRole('dialog').locator('[class*="mulliganCard"]')).toHaveCount(0);
await pages[0].getByRole('button',{name:'Keep All',exact:true}).click();await expect(pages[0].getByRole('button',{name:'Waiting for the other Ruler'})).toBeVisible();await pages[1].reload();await pages[1].getByRole('button',{name:'Online Game',exact:true}).click();await pages[1].getByRole('textbox',{name:'Table code'}).fill('ABCDEF');await pages[1].getByRole('button',{name:'Join',exact:true}).click();
await expect(pages[1].getByRole('button',{name:'Keep All',exact:true})).toBeVisible({timeout:30000});
const d=pages[1].getByRole('dialog');await expect(d.locator('[class*="mulliganCard"]')).toHaveCount(6);
for(const viewport of [{width:1440,height:900},{width:844,height:390},{width:390,height:844}]){await pages[1].setViewportSize(viewport);const result=await d.evaluate(e=>{const r=e.getBoundingClientRect();return {scroll:e.scrollHeight-e.clientHeight,horizontal:e.scrollWidth-e.clientWidth,cardsFit:[...e.querySelectorAll('[class*="mulliganCard"]')].every(c=>{const b=c.getBoundingClientRect();return b.bottom<=r.bottom&&b.top>=r.top&&b.left>=r.left&&b.right<=r.right})}});assert.equal(result.scroll,0);assert.equal(result.horizontal,0);assert(result.cardsFit);await expect.poll(()=>d.locator('[data-table-speaker] img').evaluate(e=>e.naturalWidth)).toBeGreaterThan(0);await pages[1].screenshot({path:'.tmp/mulligan-six-'+viewport.width+'.png'});console.log(viewport,result);}
await d.locator('[data-mulligan-card]').nth(0).click();await d.locator('[data-mulligan-card]').nth(1).click();await pages[1].getByRole('button',{name:'Replace 2',exact:true}).click();await expect(d.locator('[data-mulligan-flight]')).toHaveCount(1);await expect(d).toHaveCount(0,{timeout:12000});assert.deepEqual(state.supporters,assigned);assert.deepEqual(errors,[]);console.log('Online mulligan: private waiting screen, six-card fit, opposite stable supporters and both players enter board.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});




