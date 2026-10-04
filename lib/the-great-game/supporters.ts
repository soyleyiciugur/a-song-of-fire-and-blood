import type { GameState, PlayerId } from "./types";
import type { TableSpeakerId } from "./table-speaker";

export function assignSupporters(random = Math.random): Record<PlayerId, TableSpeakerId> {
  return random() < 0.5
    ? { player1: "mara", player2: "aldren" }
    : { player1: "aldren", player2: "mara" };
}

// Legacy matches get a stable display voice, but no invented historical stats.
export function playerSupporter(state: GameState, playerId: PlayerId): TableSpeakerId {
  return state.supporters?.[playerId] ?? (playerId === "player1" ? "mara" : "aldren");
}
