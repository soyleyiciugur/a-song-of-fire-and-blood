const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const source = fs.readFileSync('lib/the-great-game/rank-progression.ts', 'utf8');
const compiled = new Module('rank-progression', module);
compiled._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, 'rank-progression.js');
const { ratingProgression, playerTierForRating, playerTierLabel } = compiled.exports;

for (let rating = 0; rating <= 2000; rating++) {
  const expected = rating >= 1500 ? 's-plus' : rating >= 1350 ? 's' : rating >= 1200 ? 'a' : rating >= 1100 ? 'b' : 'c';
  assert.equal(playerTierForRating(rating), expected, `Preserve previous tier at ${rating}`);
}
const c = ratingProgression(1000);
assert.equal(c.fraction, null);
assert.equal(c.pointsToNext, 100);
assert.equal(c.next.label, 'B');
assert.equal(ratingProgression(1150).fraction, .5);
assert.equal(ratingProgression(1200).fraction, 0);
assert.equal(ratingProgression(1200).pointsToNext, 150);
assert.equal(ratingProgression(1499).pointsToNext, 1);
const highest = ratingProgression(1500);
assert.equal(highest.next, null);
assert.equal(highest.pointsToNext, null);
assert.equal(highest.fraction, null);
assert.equal(playerTierLabel(1500), 'S+');
assert.deepEqual(highest.milestones.map(m => m.state), ['completed', 'completed', 'completed', 'completed', 'current']);
assert.equal(c.milestones.filter(m => m.state === 'current').length, 1);
const font = fs.readFileSync('public/fonts/chalk/CabinSketch-Regular.ttf');
assert.equal(font.readUInt32BE(0), 0x00010000, 'Downloaded file is a TrueType font, not an error page');
assert.match(fs.readFileSync('public/fonts/chalk/OFL.txt', 'utf8'), /SIL OPEN FONT LICENSE/);
console.log('PASS preserved tiers 0–2000, boundaries, C/top-tier semantics, progression and licensed font asset');
