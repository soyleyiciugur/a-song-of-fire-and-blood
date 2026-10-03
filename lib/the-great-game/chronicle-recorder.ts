import { getGameCard, isUnitCard } from "./cards";
import { getMilitaryPower, getPoliticalPower, getMaximumHealth } from "./engine";
import type { ChronicleStatChange, GameAction, GameState, PlayerId, UnitState } from "./types";

// Only public board/resource information belongs in resolution metadata.
// Private draw logs retain their original visibility and are never copied here.
export function recordChronicleAction(before: GameState, after: GameState, action: GameAction) {
  const entries = after.log.slice(before.log.length);
  if (!entries.length) return;
  const actionId = entries[0].id;
  for (const entry of entries) entry.chronicle = { actionId };
  if (action.type === "mulligan" || action.type === "end-turn") return;

  const playerId = before.activePlayerId;
  const units = (state: GameState) => [...state.players.player1.board, ...state.players.player2.board];
  const previousUnits = units(before);
  const nextUnits = units(after);
  const changes: ChronicleStatChange[] = [];
  const add = (stat: ChronicleStatChange["stat"], from: number, to: number, owner: PlayerId, unit?: UnitState) => {
    if (from !== to) changes.push({ stat, before: from, after: to, playerId: owner, cardId: unit?.cardId, instanceId: unit?.instanceId });
  };
  for (const unit of previousUnits) {
    const next = nextUnits.find(candidate => candidate.instanceId === unit.instanceId);
    add("Health", unit.currentHealth, next?.currentHealth ?? 0, unit.ownerId, unit);
    if (!next) continue;
    add("Strength", getMilitaryPower(before, unit), getMilitaryPower(after, next), unit.ownerId, unit);
    add("Influence", getPoliticalPower(before, unit), getPoliticalPower(after, next), unit.ownerId, unit);
    add("Max Health", getMaximumHealth(before, unit), getMaximumHealth(after, next), unit.ownerId, unit);
  }
  for (const unit of nextUnits.filter(candidate => !previousUnits.some(old => old.instanceId === candidate.instanceId))) {
    const card = getGameCard(unit.cardId);
    if (!isUnitCard(card)) continue;
    add("Strength", card.strength, getMilitaryPower(after, unit), unit.ownerId, unit);
    add("Influence", card.cardType === "character" ? card.influence : 0, getPoliticalPower(after, unit), unit.ownerId, unit);
    add("Health", card.health, unit.currentHealth, unit.ownerId, unit);
  }
  for (const owner of ["player1", "player2"] as const) {
    add("Command", before.players[owner].command, after.players[owner].command, owner);
    add("Standing", before.players[owner].standing, after.players[owner].standing, owner);
  }
  const conflict = action.type === "military-attack" || action.type === "political-attack";
  const source = action.type === "play-card"
    ? before.players[playerId].hand.find(card => card.instanceId === action.handInstanceId)?.cardId
    : conflict ? previousUnits.find(unit => unit.instanceId === action.attackerInstanceId)?.cardId
    : before.pendingEffect?.sourceUnitInstanceId
      ? previousUnits.find(unit => unit.instanceId === before.pendingEffect?.sourceUnitInstanceId)?.cardId : undefined;
  const targetId = action.type === "military-attack" ? action.targetUnitInstanceId
    : action.type === "political-attack" ? action.defenderInstanceId
    : action.type === "play-card" || action.type === "resolve-pending-effect" ? action.targetInstanceId : undefined;
  const target = previousUnits.find(unit => unit.instanceId === targetId)
    ?? (action.type === "political-attack" ? previousUnits.find(unit => entries.some(entry =>
      entry.message.includes(`challenges ${getGameCard(unit.cardId).name} politically.`)
    )) : undefined);
  const primary = entries.find(entry => entry.visibility !== "owner" && /^Played /.test(entry.message))
    ?? entries.find(entry => entry.visibility !== "owner");
  if (!primary) return;
  primary.playerId = playerId;
  const enemyId = playerId === "player1" ? "player2" : "player1";
  const victory = action.type === "military-attack"
    ? (after.players[playerId].militaryWinsThisTurn ?? 0) > (before.players[playerId].militaryWinsThisTurn ?? 0)
    : after.players[enemyId].standing < before.players[enemyId].standing;
  primary.chronicle = {
    actionId, kind: conflict ? "conflict" : action.type === "play-card" ? "play" : "effect",
    sourceCardId: source, targetCardId: target?.cardId,
    sourceInstanceId: conflict ? action.attackerInstanceId : action.type === "play-card"
      ? nextUnits.find(unit => unit.cardId === source && !previousUnits.some(old => old.instanceId === unit.instanceId))?.instanceId
      : before.pendingEffect?.sourceUnitInstanceId ?? undefined,
    targetInstanceId: target?.instanceId,
    conflict: conflict ? action.type === "military-attack" ? "Military" : "Political" : undefined,
    result: conflict ? victory ? "Victory" : action.type === "political-attack" ? "Repelled" : "Resolved" : undefined,
    changes,
  };
}
