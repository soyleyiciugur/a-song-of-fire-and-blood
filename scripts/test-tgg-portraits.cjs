const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.join(process.cwd(), request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const { GET } = require('../app/api/cards/portraits/route.ts');
const { getAllGameCards } = require('../lib/the-great-game/cards.ts');
const { getCharacterPortraitVariants } = require('../lib/characterPortraits.ts');

(async () => {
  const portraits = await GET().json();
  const characters = getAllGameCards().filter(card => card.cardType === 'character');
  let missing = 0;
  for (const card of characters) {
    const id = card.linkedCharacterId ?? card.id;
    if (!portraits[id]) {
      assert.equal(Object.keys(getCharacterPortraitVariants(id)).length, 0, `Available portrait not resolved: ${id}`);
      missing++;
      continue;
    }
    assert(fs.existsSync(path.join(process.cwd(), 'public', portraits[id])), portraits[id]);
  }
  const readDirectory = fs.readdirSync;
  try {
    for (const age of ['child', 'young', 'youth', 'adult', 'elder']) {
      fs.readdirSync = directory => path.basename(directory) === 'characters'
        ? [{ name: `renrose-tyrell-${age}.webp`, isFile: () => true }]
        : [];
      const rootPortraits = await GET().json();
      assert.equal(rootPortraits['renrose-tyrell'], `/images/characters/renrose-tyrell-${age}.webp`);
    }
  } finally { fs.readdirSync = readDirectory; }
  console.log(`Validated ${characters.length - missing} available character portraits and all five root-level age suffix fallbacks. ${missing} cards have no portrait asset and retain the existing fallback.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
