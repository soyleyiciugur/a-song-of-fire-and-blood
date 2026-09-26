const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = process.cwd();
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return originalResolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
  filename,
);

const { createGame, getEffectiveCost, applyAction } = require('../lib/the-great-game/engine.ts');
const state = createGame();
state.phase = 'playing';
state.activePlayerId = 'player1';
state.players.player1.command = 10;
const handCard = { cardId: 'blackfyre', instanceId: 'test-blackfyre', costModifiers: [] };
state.players.player1.hand.push(handCard);
const unit = (cardId, ownerId, instanceId, attachedArtifactId = null) => ({
  cardId, ownerId, instanceId, attachedArtifactId, currentHealth: 5,
  exhausted: false, grounded: false, deployedThisTurn: false,
  modifiers: [], flags: {}, counters: {},
});
const enemy = unit('weylar-rocke', 'player2', 'enemy', 'blackfyre');
const ally = unit('saera-targaryen', 'player1', 'ally');
state.players.player2.board = [enemy];
state.players.player1.board = [ally];
assert.equal(getEffectiveCost(state, 'player1', handCard), 5);

const result = applyAction(state, {
  type: 'play-card', handInstanceId: handCard.instanceId, targetInstanceId: ally.instanceId,
});
assert.equal(result.ok, true, result.error);
assert.equal(result.state.players.player2.board[0].attachedArtifactId, null);
assert.equal(result.state.players.player1.board[0].attachedArtifactId, 'blackfyre');
assert.equal(result.state.players.player1.command, 5);
assert.equal(getEffectiveCost(result.state, 'player1', handCard), 4);
assert.equal(state.players.player2.board[0].attachedArtifactId, 'blackfyre', 'the original state stays immutable');
const secondState = result.state;
secondState.players.player1.command = 10;
const secondCard = { cardId: 'blackfyre', instanceId: 'second-blackfyre', costModifiers: [] };
secondState.players.player1.hand.push(secondCard);
const second = applyAction(secondState, {
  type: 'play-card', handInstanceId: secondCard.instanceId, targetInstanceId: enemy.instanceId,
});
assert.equal(second.ok, true, second.error);
assert.equal(second.state.players.player1.board[0].attachedArtifactId, null);
assert.equal(second.state.players.player2.board[0].attachedArtifactId, 'blackfyre');
assert.equal(second.state.players.player1.command, 6, 'moving an artifact from your own board has no rival surcharge');
console.log('PASS rival artifact surcharge and transfer');
