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

const { createGame, applyAction, getMilitaryCombatPreview, getMilitaryTargetOptions } = require('../lib/the-great-game/engine.ts');
const makeUnit = (cardId, ownerId, instanceId, health) => ({
  cardId, ownerId, instanceId, attachedArtifactId: null, currentHealth: health,
  exhausted: false, grounded: false, deployedThisTurn: false,
  modifiers: [], flags: {}, counters: {},
});
const state = createGame();
state.phase = 'playing';
state.activePlayerId = 'player1';
state.players.player1.board = [makeUnit('court-page', 'player1', 'zero-power', 2)];
state.players.player2.board = [makeUnit('baratheon-man-at-arms', 'player2', 'defender', 2)];

const targets = getMilitaryTargetOptions(state, 'zero-power');
assert.ok(targets.unitInstanceIds.includes('defender'));
const preview = getMilitaryCombatPreview(state, 'zero-power', 'defender');
assert.equal(preview.defenderDamageTaken, 0);
assert.equal(preview.attackerDies, true);
const result = applyAction(state, {
  type: 'military-attack', attackerInstanceId: 'zero-power', targetUnitInstanceId: 'defender',
});
assert.equal(result.ok, true, result.error);
assert.equal(result.state.players.player1.board.some(unit => unit.instanceId === 'zero-power'), false);
assert.equal(result.state.players.player2.board.find(unit => unit.instanceId === 'defender')?.currentHealth, 2);
console.log('PASS zero-power unit attacks, deals no damage, and can die to the defender');
