import type {
  GameAction,
  GameState,
  PlayerId,
} from "./types";

export type GreatGameMatchStatus =
  | "waiting"
  | "active"
  | "finished"
  | "abandoned";

export interface GreatGameOnlinePlayer {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface GreatGameOnlineMatchView {
  id: string;
  code: string;
  status: GreatGameMatchStatus;
  version: number;
  playerId: PlayerId;
  host: GreatGameOnlinePlayer;
  guest: GreatGameOnlinePlayer | null;
  opponent: GreatGameOnlinePlayer | null;
  state: GameState | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface GreatGameOnlineMatchSummary {
  id: string;
  code: string;
  status: GreatGameMatchStatus;
  version: number;
  playerId: PlayerId;
  opponent: GreatGameOnlinePlayer | null;
  updatedAt: string;
}

export interface GreatGameActionRequest {
  op: "action";
  matchId: string;
  version: number;
  action: GameAction;
}

const HIDDEN_CARD_ID = "__great_game_hidden_card__";

/**
 * Returns the state a particular participant is allowed to see.
 *
 * The database keeps the complete authoritative state. The browser receives
 * its own private zones plus public information. The opponent's deck and hand
 * retain only their lengths, so browser devtools cannot reveal hidden cards.
 * Veiled Sight is the deliberate exception while its mandatory effect is being
 * resolved by the viewer.
 */
export function projectGameStateForPlayer(
  state: GameState,
  viewerId: PlayerId
): GameState {
  const projected = structuredClone(state);
  const opponentId: PlayerId =
    viewerId === "player1" ? "player2" : "player1";
  const opponent = projected.players[opponentId];

  opponent.deck = opponent.deck.map(() => HIDDEN_CARD_ID);

  const maySeeOpponentHand =
    projected.pendingEffect?.abilityId === "veiled-sight" &&
    projected.pendingEffect.controllerId === viewerId;

  if (!maySeeOpponentHand) {
    opponent.hand = opponent.hand.map((_, index) => ({
      instanceId: `hidden-hand-${opponentId}-${index}`,
      cardId: HIDDEN_CARD_ID,
      costModifiers: [],
    }));
  }

  return projected;
}

export function playerIdForUser(
  match: { host_id: string; guest_id: string | null },
  userId: string
): PlayerId | null {
  if (match.host_id === userId) return "player1";
  if (match.guest_id === userId) return "player2";
  return null;
}

export function normalizeMatchCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}
