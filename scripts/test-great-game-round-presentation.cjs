require("./test-great-game-decks.cjs");
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {gameTurnLabel,gameTurnNumber}=require('../lib/the-great-game/turn-labels.ts');
assert.equal(gameTurnLabel(0),'Opening');
for(let round=1;round<=25;round++){
  assert.equal(gameTurnNumber(2*round-1),round);
  assert.equal(gameTurnNumber(2*round),round);
  assert.equal(gameTurnLabel(2*round-1),`Exchange ${round}`);
  assert.equal(gameTurnLabel(2*round),`Exchange ${round}`);
}
const chronicle=fs.readFileSync('components/the-great-game/Chronicle.tsx','utf8');
assert.match(chronicle,/const rounds = useMemo/);
assert.match(chronicle,/parts\.map\(\(\{turn,events:turnEvents\}\)/);
const api=fs.readFileSync('app/api/great-game/rank-history/route.ts','utf8');
assert.match(api,/\.eq\("match_type","ranked"\)/);
const ui=fs.readFileSync('components/the-great-game/GreatGameTable.tsx','utf8');
assert.match(ui,/Card Burned/);
assert.match(ui,/burningCardReveal/);
console.log('PASS 25 round boundaries, grouped Chronicle, ranked-only history and burned preview wiring');
