import type { GameState } from "./types";
import { projectGameStateForPlayer } from "./online";

/** Public table only. Never serialize either hand, deck, pending choice or private log. */
export function spectatorSnapshot(state: GameState) {
  const publicState = { ...state, pendingEffect: null };
  const hostLog = new Set(projectGameStateForPlayer(publicState, "player1").log.map(entry => entry.id));
  const log = projectGameStateForPlayer(publicState, "player2").log.filter(entry => hostLog.has(entry.id));
  const player = (id: "player1" | "player2") => ({
    standing: state.players[id].standing, command: state.players[id].command,
    maxCommand: state.players[id].maxCommand, board: structuredClone(state.players[id].board),
    handCount: state.players[id].hand.length, deckCount: state.players[id].deck.length,
  });
  return { turnNumber: state.turnNumber, activePlayerId: state.activePlayerId, phase: state.phase,
    winner: state.winner, activeLocation: state.activeLocation, players: { player1: player("player1"), player2: player("player2") }, log };
}
export type SpectatorView = {
  id: string; status: string; version: number;
  host: string; guest: string;
  state: ReturnType<typeof spectatorSnapshot>;
};
