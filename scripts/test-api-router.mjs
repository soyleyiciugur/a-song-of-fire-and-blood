import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=fs.readFileSync('app/api/[...path]/route.ts','utf8');
const routes=[...source.matchAll(/"([^"]+)": handler\d+,/g)].map(m=>m[1]);
const expected=[];const routerModule={exports:{}};
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(compiled,{exports:routerModule.exports,require(id){if(id==='next/server')return {};const file=id.replace('@/','')+'.ts';const code=fs.readFileSync(file,'utf8');const methods=[...code.matchAll(/export (?:async )?function (GET|POST|PATCH|DELETE|PUT)\(/g)].map(m=>m[1]);const route=file.slice('lib/server-api/'.length).replace('/handler.ts','');expected.push({route,methods});return Object.fromEntries(methods.map(method=>[method,async req=>new Response(req.url,{status:200,headers:{'x-handler':route+':'+method}})]));},Response});
(async()=>{assert.equal(routes.length,36);for(const {route,methods} of expected){for(const method of methods){const request={method,url:'https://example.com/api/'+route+'?cursor=preserved'};const response=await routerModule.exports[method](request,{params:Promise.resolve({path:route.split('/')})});assert.equal(response.headers.get('x-handler'),route+':'+method);assert.equal(await response.text(),request.url);}
const context={params:Promise.resolve({path:route.split('/')})};assert.equal((await routerModule.exports.OPTIONS({method:'OPTIONS'},context)).status,204);if(!methods.includes('PUT'))assert.equal((await routerModule.exports.PUT({method:'PUT'},context)).status,405);if(methods.includes('GET'))assert.equal(await (await routerModule.exports.HEAD({method:'HEAD',url:'https://example.com'},context)).text(),'');}
for(const key of ['missing','toString','__proto__'])assert.equal((await routerModule.exports.GET({method:'GET'},{params:Promise.resolve({path:[key]})})).status,404);console.log('API router: all 36 paths, methods, query strings, HEAD, OPTIONS, 404 and 405 passed.');})().catch(error=>{console.error(error);process.exitCode=1});


