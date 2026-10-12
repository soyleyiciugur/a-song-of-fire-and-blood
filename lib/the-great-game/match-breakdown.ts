import { findGameCard } from "./cards";
import type { GameState, PlayerId } from "./types";

export function matchBreakdown(state: GameState) {
  const player = (id: PlayerId) => ({
    standing: state.players[id].standing,
    rulerTurns: state.players[id].turnsTaken,
    units: state.players[id].board.length,
    deck: state.players[id].deck.length,
    hand: state.players[id].hand.filter(card => card.cardId !== "royal-favor").length,
    burned: state.players[id].burnedCards.length,
    plays: 0, characters: 0, dragons: 0, events: 0, artifacts: 0, locations: 0,
    military: 0, political: 0,
    favorUsed: state.players[id].removedFromGame.includes("royal-favor"),
  });
  const players = { player1: player("player1"), player2: player("player2") };
  const seen = new Set<string>();
  let legacyActions = false;
  for (const entry of state.log) {
    if (entry.visibility === "owner" || !entry.playerId) continue;
    const meta = entry.chronicle;
    if (!meta?.kind) {
      if (/^Played .+ for \d+ Command\.$|Military Conflict|Political Conflict/.test(entry.message) && !meta) legacyActions = true;
      continue;
    }
    if (meta.kind !== "play" && meta.kind !== "conflict") continue;
    const key = `${meta.kind}:${meta.actionId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const result = players[entry.playerId];
    if (meta.kind === "conflict") {
      if (meta.conflict === "Military") result.military++;
      if (meta.conflict === "Political") result.political++;
    } else if (meta.sourceCardId !== "royal-favor") {
      result.plays++;
      const card = meta.sourceCardId ? findGameCard(meta.sourceCardId) : null;
      if (card?.cardType === "character") result.characters++;
      if (card?.cardType === "dragon") result.dragons++;
      if (card?.cardType === "event") result.events++;
      if (card?.cardType === "artifact") result.artifacts++;
      if (card?.cardType === "location") result.locations++;
    }
  }
  return { players, legacyActions };
}
