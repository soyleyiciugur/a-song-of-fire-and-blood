// lib/the-great-game/types.ts

// ─────────────────────────────────────────────
// Core
// ─────────────────────────────────────────────

export type PlayerId =
  | "player1"
  | "player2";

export type CardType =
  | "character"
  | "dragon"
  | "event"
  | "artifact"
  | "location";

export type TierId =
  | "s-plus"
  | "s"
  | "a"
  | "b"
  | "c";

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
  | "board-clear"
  | "resource";

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
  | "word-in-the-right-ear"
  | "blackfyre"
  | "at-your-throat"
  | "dragonstone"
  | "kings-landing"
  | "oldtown"
  | "royal-favor";

export type SpecialCardKind =
  | "royal-favor";

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

  tierId: TierId;

  name: string;
  subtitle?: string;

  houseId?: string;

  cost: number;

  traits: Trait[];
  abilities: CardAbility[];

  roles: InternalRole[];

  flavorQuote?: string;

  linkedCharacterId?: string;

  generic?: boolean;

  deckable?: boolean;

  special?: SpecialCardKind;
}

export interface CharacterCard
  extends BaseCard {
  cardType: "character";

  power: number;
  influence: number;
  health: number;
}

export interface DragonCard
  extends BaseCard {
  cardType: "dragon";

  power: number;
  health: number;
}

export interface EventCard
  extends BaseCard {
  cardType: "event";
}

export interface ArtifactCard
  extends BaseCard {
  cardType: "artifact";
}

export interface LocationCard
  extends BaseCard {
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
// Hand
// ─────────────────────────────────────────────

export type HandModifierExpiration =
  | "start-of-player-turn"
  | "end-of-player-turn";

export interface HandCostModifier {
  id: string;

  amount: number;

  expiresAt: HandModifierExpiration;

  expiresForPlayerId: PlayerId;
}

export interface HandCardState {
  instanceId: string;

  cardId: string;

  costModifiers: HandCostModifier[];
}

// ─────────────────────────────────────────────
// Unit state
// ─────────────────────────────────────────────

export interface UnitState {
  instanceId: string;

  cardId: string;

  ownerId: PlayerId;

  currentHealth: number;

  exhausted: boolean;

  deployedThisTurn: boolean;

  grounded: boolean;

  attachedArtifactId: string | null;

  modifiers: RuntimeModifier[];

  counters: Record<
    string,
    number
  >;

  flags: Record<
    string,
    boolean
  >;
}

// ─────────────────────────────────────────────
// Player
// ─────────────────────────────────────────────

export interface PlayerState {
  id: PlayerId;

  standing: number;

  turnsTaken: number;

  maxCommand: number;
  command: number;

  nextCommandBonus: number;

  deck: string[];

  hand: HandCardState[];

  discard: string[];

  board: UnitState[];

  burnedCards: string[];

  removedFromGame: string[];

  eventsPlayedThisTurn: number;
}

// ─────────────────────────────────────────────
// Location
// ─────────────────────────────────────────────

export interface ActiveLocationState {
  cardId: string;

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

  triggerPlayerId: PlayerId;

  targetUnitInstanceId: string;
}

// ─────────────────────────────────────────────
// Mandatory ability resolution
// ─────────────────────────────────────────────

export interface PendingEffectState {
  id: string;

  controllerId: PlayerId;

  sourceUnitInstanceId: string;

  abilityId:
    | "manders-pact"
    | "veiled-sight"
    | "iron-wrath";
}

// ─────────────────────────────────────────────
// Mulligan
// ─────────────────────────────────────────────

export type GamePhase =
  | "mulligan-player1"
  | "mulligan-player2"
  | "playing"
  | "finished";

export interface MulliganState {
  completed: Record<
    PlayerId,
    boolean
  >;
}

// ─────────────────────────────────────────────
// Game
// ─────────────────────────────────────────────

export type GameWinner =
  | PlayerId
  | "draw"
  | null;

export interface GameState {
  turnNumber: number;

  activePlayerId: PlayerId;

  phase: GamePhase;

  mulligan: MulliganState;

  players: Record<
    PlayerId,
    PlayerState
  >;

  activeLocation:
    | ActiveLocationState
    | null;

  delayedEffects:
    DelayedEffect[];

  pendingEffect:
    | PendingEffectState
    | null;

  winner: GameWinner;

  log: GameLogEntry[];

  nextInstanceNumber: number;
}

export interface GameLogEntry {
  id: number;

  turn: number;

  playerId?: PlayerId;

  message: string;
}

// ─────────────────────────────────────────────
// Conflict
// ─────────────────────────────────────────────

export type ConflictType =
  | "military"
  | "political";

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

export interface MulliganAction {
  type: "mulligan";

  replaceHandInstanceIds: string[];
}

export interface ResolvePendingEffectAction {
  type: "resolve-pending-effect";

  targetInstanceId?: string;

  targetHandInstanceId?: string;
}

export interface MilitaryAttackAction {
  type: "military-attack";

  attackerInstanceId: string;

  targetUnitInstanceId?: string;

  targetPlayerId?: PlayerId;
}

export interface PoliticalAttackAction {
  type: "political-attack";

  attackerInstanceId: string;

  defenderInstanceId?: string;
}

export interface PlayCardAction {
  type: "play-card";

  handInstanceId: string;

  targetInstanceId?: string;

  secondaryTargetInstanceId?: string;

  targetHandInstanceId?: string;
}

export interface EndTurnAction {
  type: "end-turn";
}

export type GameAction =
  | MulliganAction
  | ResolvePendingEffectAction
  | PlayCardAction
  | MilitaryAttackAction
  | PoliticalAttackAction
  | EndTurnAction;

// ─────────────────────────────────────────────
// Result
// ─────────────────────────────────────────────

export interface ActionResult {
  ok: boolean;

  state: GameState;

  error?: string;
}