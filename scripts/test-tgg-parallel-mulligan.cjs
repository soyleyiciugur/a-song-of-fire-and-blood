const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');

const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.join(process.cwd(), request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);

const { createGame, applyAction } = require('../lib/the-great-game/engine.ts');
const { projectGameStateForPlayer } = require('../lib/the-great-game/online.ts');

for (const order of [['player1', 'player2'], ['player2', 'player1']]) {
  let state = createGame();
  const opening = structuredClone(state.players);
  for (const [index, playerId] of order.entries()) {
    const selected = opening[playerId].hand[0].instanceId;
    const result = applyAction(state, { type: 'mulligan', actorPlayerId: playerId, replaceHandInstanceIds: [selected] });
    assert(result.ok, result.error);
    state = result.state;
    assert.equal(state.mulligan.completed[playerId], true);
    assert.equal(state.phase === 'playing', index === 1);
    if (index === 0) {
      const duplicate = applyAction(state, { type: 'mulligan', actorPlayerId: playerId, replaceHandInstanceIds: [] });
      assert.equal(duplicate.ok, false);
      const other = playerId === 'player1' ? 'player2' : 'player1';
      const projected = projectGameStateForPlayer(state, other);
      assert(projected.players[playerId].hand.every(card => card.cardId === '__great_game_hidden_card__'));
    }
  }
  assert(state.players.player2.hand.some(card => card.cardId === 'royal-favor'));
}
console.log('Both mulligan orders, duplicate rejection, private hands and game start passed.');
