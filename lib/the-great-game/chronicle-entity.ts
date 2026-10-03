import { getGameCard } from "./cards";
import { getEffectiveCost, getMaximumHealth, getMilitaryPower, getPoliticalPower } from "./engine";
import type { GameState, PlayerId, UnitState } from "./types";

export type ChronicleEntityRef = { cardId: string; instanceId?: string; playerId?: PlayerId };

export function resolveChronicleEntity(state: GameState, viewerId: PlayerId, ref: ChronicleEntityRef) {
  const card = getGameCard(ref.cardId);
  const board = [...state.players.player1.board, ...state.players.player2.board];
  // An exact historical instance must never fall through to a newer copy of that card.
  const matches = board.filter(unit => unit.cardId === ref.cardId && (!ref.instanceId || unit.instanceId === ref.instanceId));
  const owned = matches.filter(unit => unit.ownerId === ref.playerId);
  const units = ref.instanceId ? matches : owned.length ? owned : matches;
  // Hand costs are viewer-local. Opponent hand identities are never needed here.
  const hand = !units.length && !ref.instanceId && (!ref.playerId || ref.playerId === viewerId)
    ? state.players[viewerId].hand.filter(item => item.cardId === ref.cardId) : [];
  const equipped = board.filter(unit => unit.attachedArtifactId === ref.cardId);
  return {
    card, units, hand, equipped,
    handCosts: hand.map(item => ({ instanceId: item.instanceId, cost: getEffectiveCost(state, viewerId, item) })),
    cost: hand.length === 1 ? getEffectiveCost(state, viewerId, hand[0]) : card.cost,
    status: units.length ? "In play" : hand.length ? "In hand"
      : card.cardType === "location" ? state.activeLocation?.cardId === card.id ? "Active Location" : "Inactive Location"
      : equipped.length ? "Equipped" : ref.instanceId ? "No longer in play · card reference" : "Not in play · card reference",
  };
}

export function chronicleUnitStats(state: GameState, unit: UnitState) {
  return { strength: getMilitaryPower(state, unit), influence: getPoliticalPower(state, unit),
    health: unit.currentHealth, maxHealth: getMaximumHealth(state, unit) };
}
