import type { GameState, PlayerId } from "./types";

export type TurnContext = { owner?: PlayerId; rulerTurn?: number };
/** Read explicit engine counters; never infer a ruler's turn from game-turn parity. */
export function chronicleTurns(state: GameState): Map<number, TurnContext> {
  const result = new Map<number, TurnContext>();
  for (const entry of state.log) {
    if (entry.turn === 0) continue;
    const previous = result.get(entry.turn) ?? {};
    const begin = entry.message.match(/^Player [12] begins Turn (\d+)\.$/);
    result.set(entry.turn, {
      owner: entry.turnOwnerId ?? (begin ? entry.playerId : undefined) ?? previous.owner,
      rulerTurn: entry.rulerTurn && entry.rulerTurn > 0 ? entry.rulerTurn : begin ? Number(begin[1]) : previous.rulerTurn,
    });
  }
  if (state.turnNumber > 0) result.set(state.turnNumber, { owner: state.activePlayerId, rulerTurn: state.players[state.activePlayerId].turnsTaken });
  return result;
}
/** The persisted counter advances once per ruler turn; Exchange advances after two ruler turns. Do not mutate persisted log indices. */
export function gameTurnNumber(engineTurn:number) {return Math.ceil(Math.max(0,engineTurn)/2);}
export function gameTurnLabel(turn: number) { return turn === 0 ? "Opening" : `Exchange ${gameTurnNumber(turn)}`; }
export function rulerTurnLabel(context: TurnContext | undefined, viewerId: PlayerId) {
  if (!context?.owner) return "Preparation";
  const owner = context.owner === viewerId ? "Your" : "Opponent's";
  return `${owner} turn${context.rulerTurn ? ` ${context.rulerTurn}` : ""}`;
}
