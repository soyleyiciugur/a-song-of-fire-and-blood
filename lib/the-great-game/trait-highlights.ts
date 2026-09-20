import { getGameCard } from "./cards";
import { getMilitaryTargetOptions, getPoliticalDefenseOptions, unitHasTrait } from "./engine";
import type { GameState, PlayerId, Trait, UnitState } from "./types";

type ConflictPreview = { kind: "military" | "political"; attackerInstanceId: string };

// These are the rider/dragon pairs supported by the engine's Bond ability.
const bondedDragons: Record<string, string> = {
  "jacaelon-targaryen": "jhagar",
  "saera-targaryen": "cloudgazer",
  "baelenys-targaryen": "maelwing",
};

/** Viewer-local hints only; never read the opposing player's hand. */
export function getTraitHighlights(
  state: GameState,
  viewer: PlayerId,
  unit: UnitState,
  conflict: ConflictPreview | null = null,
): Trait[] {
  if (state.phase !== "playing" || state.activePlayerId !== viewer) return [];
  const result: Trait[] = [];
  const has = (trait: Trait) => unitHasTrait(state, unit, trait);
  if (unit.ownerId === viewer) {
    if (unit.deployedThisTurn && !unit.exhausted) {
      if (!unit.grounded && has("swift")) result.push("swift");
      if (getGameCard(unit.cardId).cardType === "character" && has("schemer")) result.push("schemer");
    }
    if (has("dragonrider") && state.players[viewer].hand.some(card => card.cardId === bondedDragons[unit.cardId])) {
      result.push("dragonrider");
    }
  }
  const attacker = conflict && state.players[viewer].board.find(card => card.instanceId === conflict.attackerInstanceId);
  if (!attacker || !conflict) return result;
  const bypass = conflict.kind === "military" ? "challenge" : "confront";
  if (unit.instanceId === attacker.instanceId && has(bypass)) result.push(bypass);
  if (unit.ownerId === viewer || unitHasTrait(state, attacker, bypass)) return result;
  if (conflict.kind === "military" && has("guard") && getMilitaryTargetOptions(state, attacker.instanceId).unitInstanceIds.includes(unit.instanceId)) result.push("guard");
  if (conflict.kind === "political" && has("intrigue") && getPoliticalDefenseOptions(state, attacker.instanceId).defenderInstanceIds.includes(unit.instanceId)) result.push("intrigue");
  return result;
}
