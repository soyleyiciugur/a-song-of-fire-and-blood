// lib/the-great-game/types.ts

// ─────────────────────────────────────────────
// Core IDs / enums
// ─────────────────────────────────────────────

export type PlayerId = "player1" | "player2";

export type CardType =
  | "character"
  | "dragon"
  | "event"
  | "artifact"
  | "location";

export type Trait =
  | "unique"
  | "dragon"
  | "dragonrider"
  | "guard"
  | "intrigue"
  | "swift"
  | "schemer"
  | "challenge"
  | "confront";

export type InternalRole =
  | "core"
  | "finisher"
  | "military"
  | "political"
  | "support"
  | "control"
  | "tempo"
  | "value"
  | "utility"
  | "durable"
  | "defensive"
  | "aggro"
  | "vanilla"
  | "french-vanilla"
  | "hybrid-vanilla"
  | "removal"
  | "board-clear";

export type AbilityTrigger =
  | "arrival"
  | "fall"
  | "victory"
  | "start-of-turn"
  | "end-of-turn"
  | "passive"
  | "event"
  | "bond";

export type AbilityId =
  | "silent-verdict"
  | "housebreaker"
  | "dawns-edge"
  | "manders-pact"
  | "as-i-was-saying"
  | "veiled-sight"
  | "iron-wrath"
  | "price-of-loyalty"
  | "bond-jacaelon"
  | "bond-saera"
  | "bond-baelenys"
  | "trial-by-combat"
  | "oldtown-massacre"
  | "brothers-tilt"
  | "blackfyre"
  | "at-your-throat"
  | "dragonstone"
  | "kings-landing"
  | "oldtown";

// ─────────────────────────────────────────────
// Card definitions
// ─────────────────────────────────────────────

export interface CardAbility {
  id: AbilityId;
  name: string;
  trigger: AbilityTrigger;
  text: string;
}

interface BaseCard {
  id: string;

  cardType: CardType;

  name: string;
  subtitle?: string;

  houseId?: string;

  cost: number;

  traits: Trait[];

  abilities: CardAbility[];

  /**
   * Internal balance/design metadata.
   * Not displayed on the card UI.
   */
  roles: InternalRole[];

  flavorQuote?: string;

  /**
   * Optional link back to the lore/character database.
   */
  linkedCharacterId?: string;

  /**
   * Generic units obey the unique generic
   * stat-skeleton design rule.
   */
  generic?: boolean;
}

export interface CharacterCard extends BaseCard {
  cardType: "character";

  power: number;
  influence: number;
  health: number;
}

export interface DragonCard extends BaseCard {
  cardType: "dragon";

  power: number;
  health: number;

  /**
   * Dragons deliberately have no Influence.
   */
}

export interface EventCard extends BaseCard {
  cardType: "event";
}

export interface ArtifactCard extends BaseCard {
  cardType: "artifact";
}

export interface LocationCard extends BaseCard {
  cardType: "location";
}

export type GameCard =
  | CharacterCard
  | DragonCard
  | EventCard
  | ArtifactCard
  | LocationCard;

// ─────────────────────────────────────────────
// Runtime modifiers
// ─────────────────────────────────────────────

export type ModifierExpiration =
  | "start-of-controller-next-turn"
  | "end-of-controller-turn"
  | "end-of-current-turn";

export interface RuntimeModifier {
  id: string;

  power?: number;
  influence?: number;
  health?: number;
  cost?: number;

  permanent: boolean;

  expiresAt?: ModifierExpiration;
}

// ─────────────────────────────────────────────
// Hand runtime state
// ─────────────────────────────────────────────

export type HandModifierExpiration =
  | "start-of-player-turn"
  | "end-of-player-turn";

export interface HandCostModifier {
  id: string;

  amount: number;

  expiresAt: HandModifierExpiration;

  /**
   * Whose turn controls expiration.
   *
   * Example:
   * Veiled Sight targets an enemy hand card,
   * but expires at the start of Saera's
   * controller's next turn.
   */
  expiresForPlayerId: PlayerId;
}

export interface HandCardState {
  /**
   * Unique runtime instance.
   *
   * Important because two copies of the same
   * card can exist in a hand at once.
   */
  instanceId: string;

  cardId: string;

  costModifiers: HandCostModifier[];
}

// ─────────────────────────────────────────────
// Unit runtime state
// ─────────────────────────────────────────────

export interface UnitState {
  instanceId: string;

  cardId: string;

  ownerId: PlayerId;

  currentHealth: number;

  /**
   * Exhausted units cannot initiate normal
   * conflicts.
   *
   * Political defenders must also be Ready.
   */
  exhausted: boolean;

  /**
   * A newly played Character or Dragon cannot
   * initiate a normal conflict that turn.
   *
   * Swift ignores this for Military.
   * Schemer ignores this for Political.
   *
   * This restriction expires at the end of
   * its controller's turn.
   */
  deployedThisTurn: boolean;

  /**
   * Dragon-only state.
   *
   * Grounded Dragons remain on board but:
   * - cannot attack
   * - cannot defend
   * - cannot use abilities
   */
  grounded: boolean;

  /**
   * Card ID of the equipped Artifact.
   *
   * MVP:
   * max 1 Artifact per Character.
   */
  attachedArtifactId: string | null;

  modifiers: RuntimeModifier[];

  /**
   * Generic number storage used by
   * card-specific engine mechanics.
   *
   * Examples:
   * - Weylar turns-in-play
   * - Dawn's Edge prevention tracking
   */
  counters: Record<string, number>;

  /**
   * Generic boolean storage used by
   * card-specific engine mechanics.
   *
   * Examples:
   * - Weylar already triggered
   * - Cordin previous successful draw
   */
  flags: Record<string, boolean>;
}

// ─────────────────────────────────────────────
// Player runtime state
// ─────────────────────────────────────────────

export interface PlayerState {
  id: PlayerId;

  standing: number;

  /**
   * Normal Command cap for the current turn.
   *
   * Progresses 1 → 10.
   */
  maxCommand: number;

  /**
   * Command currently available to spend.
   */
  command: number;

  /**
   * Temporary Command granted for the next turn.
   *
   * Example:
   * Weylar Rocke.
   */
  nextCommandBonus: number;

  /**
   * Deck contains card IDs only.
   *
   * Runtime instance IDs are generated
   * when cards enter the hand.
   */
  deck: string[];

  hand: HandCardState[];

  /**
   * Discard stores card IDs.
   */
  discard: string[];

  board: UnitState[];

  /**
   * Cards burned because the hand
   * was already at the 8-card limit.
   */
  burnedCards: string[];

  /**
   * Needed for Oldtown:
   * "The first Event each player plays
   * on their turn costs 1 less."
   */
  eventsPlayedThisTurn: number;
}

// ─────────────────────────────────────────────
// Location state
// ─────────────────────────────────────────────

export interface ActiveLocationState {
  cardId: string;

  /**
   * Needed so the Location can return to
   * the correct discard pile when replaced.
   */
  playedBy: PlayerId;
}

// ─────────────────────────────────────────────
// Delayed effects
// ─────────────────────────────────────────────

export type DelayedEffectType =
  | "manders-pact-draw";

export interface DelayedEffect {
  id: string;

  type: DelayedEffectType;

  /**
   * Effect resolves at the start of
   * this player's turn.
   */
  triggerPlayerId: PlayerId;

  /**
   * Mander's Pact only draws if the
   * chosen Character is still in play.
   */
  targetUnitInstanceId: string;
}

// ─────────────────────────────────────────────
// Game state
// ─────────────────────────────────────────────

export type GameWinner =
  | PlayerId
  | "draw"
  | null;

export interface GameState {
  turnNumber: number;

  activePlayerId: PlayerId;

  players: Record<PlayerId, PlayerState>;

  activeLocation: ActiveLocationState | null;

  delayedEffects: DelayedEffect[];

  winner: GameWinner;

  /**
   * Useful for:
   * - local debug UI
   * - gameplay history
   * - later online action history
   */
  log: GameLogEntry[];

  /**
   * Global runtime instance counter.
   *
   * Used for:
   * - hand instances
   * - unit instances
   * - modifiers
   * - delayed effects
   */
  nextInstanceNumber: number;
}

export interface GameLogEntry {
  id: number;

  turn: number;

  playerId?: PlayerId;

  message: string;
}

// ─────────────────────────────────────────────
// Combat / conflict
// ─────────────────────────────────────────────

export type ConflictType =
  | "military"
  | "political";

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

export interface MilitaryAttackAction {
  type: "military-attack";

  attackerInstanceId: string;

  /**
   * Military attacks target either:
   *
   * - an enemy unit
   * OR
   * - enemy Standing
   *
   * Never both.
   */
  targetUnitInstanceId?: string;

  targetPlayerId?: PlayerId;
}

export interface PoliticalAttackAction {
  type: "political-attack";

  attackerInstanceId: string;

  /**
   * Political defender.
   *
   * Required when the defender must be
   * explicitly selected.
   *
   * Examples:
   * - multiple Intrigue defenders
   * - Confront
   * - normal defender choice
   */
  defenderInstanceId?: string;
}

export interface PlayCardAction {
  type: "play-card";

  /**
   * Exact physical card instance in hand.
   *
   * Using handInstanceId rather than cardId
   * matters because:
   * - duplicate cards can exist
   * - individual cards can have cost modifiers
   * - Veiled Sight targets a specific copy
   */
  handInstanceId: string;

  /**
   * Primary board target.
   *
   * Used by:
   * - The Mander's Pact
   * - Iron Wrath
   * - Artifacts
   * - The Brothers' Tilt
   * - Trial by Combat
   */
  targetInstanceId?: string;

  /**
   * Secondary board target.
   *
   * Used by Trial by Combat.
   */
  secondaryTargetInstanceId?: string;

  /**
   * Exact card instance in the opponent's hand.
   *
   * Used by Veiled Sight.
   */
  targetHandInstanceId?: string;
}

export interface EndTurnAction {
  type: "end-turn";
}

export type GameAction =
  | PlayCardAction
  | MilitaryAttackAction
  | PoliticalAttackAction
  | EndTurnAction;

// ─────────────────────────────────────────────
// Action results
// ─────────────────────────────────────────────

export interface ActionResult {
  ok: boolean;

  state: GameState;

  error?: string;
}