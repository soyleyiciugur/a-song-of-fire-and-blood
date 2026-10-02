import { applyAction } from "./engine";
import type { GameState } from "./types";

export function getPlacementPreview(state: GameState, handInstanceId: string, boardIndex: number): GameState | null {
  const result = applyAction(state, { type: "play-card", handInstanceId, boardIndex });
  return result.ok ? result.state : null;
}
