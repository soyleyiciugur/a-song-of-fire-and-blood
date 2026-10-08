import type { GameState } from "./types";
import type { GreatGameOnlineMatchView, GreatGameOnlinePlayer } from "./online";
/** God-mode viewers can inspect either hand, but never receive future deck order. */
export function spectatorSnapshot(state: GameState): GameState {
  const result = structuredClone(state);
  for (const id of ["player1", "player2"] as const) result.players[id].deck = result.players[id].deck.map(() => "__great_game_hidden_card__");
  result.pendingEffect = null;
  result.log = result.log.filter(entry => entry.visibility !== "owner");
  return result;
}
export type SpectatorView = { match: GreatGameOnlineMatchView; viewer: GreatGameOnlinePlayer };
