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
  | "rally-the-men"
  | "command-the-room"
  | "silent-verdict"
  | "housebreaker"
  | "dawns-edge"
  | "a-son-forewarned"
  | "manders-pact"
  | "as-i-was-saying"
  | "veiled-sight"
  | "iron-wrath"
  | "price-of-loyalty"
  | "hidden-claim"
  | "people-have-suffered-enough"
  | "argumentative-one"
  | "dangerous-name"
  | "buried-secret"
  | "dark-sisters-legacy"
  | "the-confession"
  | "you-never-saw-me"
  | "playing-her-own-game"
  | "starfalls-shadow"
  | "our-fleet-is-yours"
  | "the-gods-will-judge"
  | "dreams-of-things-to-come"
  | "innkeeper-another"
  | "a-baratheon-kneels-when-he-feels-safe"
  | "knights-of-oldtown"
  | "the-last-name-standing"
  | "gracious-in-defeat"
  | "when-people-look-up"
  | "he-asked-for-parley"
  | "seven-feet-of-grievance"
  | "im-no-knight-nor-lady"
  | "experience-triumphs"
  | "they-pass-over-real-men"
  | "royal-blood"
  | "dragonstones-quiet"
  | "she-organized-the-whole-thing"
  | "whereabouts-unknown"
  | "death-in-his-own-bed"
  | "deal-with-the-money"
  | "safe-passage"
  | "proud-of-his-name"
  | "do-not-forget-it-my-lady"
  | "they-are-utterly-fucked"
  | "unintended"
  | "an-unfortunate-accident"
  | "a-drunken-mistake"
  | "bond-jacaelon"
  | "bond-saera"
  | "bond-baelenys"
  | "word-in-the-right-ear"
  | "trial-by-combat"
  | "oldtown-massacre"
  | "brothers-tilt"
  | "blackfyre"
  | "at-your-throat"
  | "kings-landing"
  | "dragonstone"
  | "oldtown"
  | "winterfell"
  | "starfall"
  | "driftmark"
  | "storms-end"
  | "highgarden"
  | "riverrun"
  | "sunspear"
  | "castle-black"
  | "braavos"
  | "tyrosh"
  | "royal-favor"
  | "winter-s-welcome"
  | "a-moment-of-sight"
  | "a-friend-summoned"
  | "seen-from-the-doorway"
  | "pull-him-clear"
  | "hold-fast"
  | "pay-the-iron-price"
  | "read-the-crowd"
  | "the-stage-remains"
  | "perfect-timing"
  | "quiet-protection"
  | "promising-blade"
  | "before-dawn"
  | "guarded-questions"
  | "know-when-enough-is-enough"
  | "golden-rose-brooch"
  | "starfall-s-shelter"
  | "a-crown-of-command"
  | "endure-the-crown"
  | "dragonstone-household"
  | "blood-of-the-crown"
  | "the-lion-s-levy"
  | "western-court"
  | "ember-of-ashemark"
  | "ironborn-defiance"
  | "a-father-s-legacy"
  | "north-and-dorne"
  | "the-next-lord"
  | "river-knight"
  | "guard-the-household"
  | "the-eyrie-s-pride"
  | "a-debt-remembered"
  | "dornish-patience"
  | "unbowed-counsel"
  | "tides-of-court";

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

  balanceStatus?: "provisional";
}

export interface CharacterCard
  extends BaseCard {
  cardType: "character";

  strength: number;
  influence: number;
  health: number;
}

export interface DragonCard
  extends BaseCard {
  cardType: "dragon";

  strength: number;
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

  strength?: number;
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
  | "end-of-player-turn"
  | "while-in-hand";

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

  // Remaining current Health that came from positive Health bonuses.
  // Damage consumes this layer before base Health. Optional for backwards
  // compatibility with saved games created before layered bonus Health.
  bonusHealth?: number;

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

  // Explicitly uncapped next-turn Command (currently used by Braavos).
  nextCommandBonusUncapped?: number;

  conflictsInitiatedThisTurn?: number;
  militaryConflictsInitiatedThisTurn?: number;
  starfallCharacterConflictUsedThisTurn?: boolean;
  militaryWinsThisTurn?: number;
  charactersDeployedThisTurn?: number;

  oldtownModifierUsedThisTurn?: boolean;
  sunspearPoisonAppliedThisTurn?: boolean;

  characterDestroyedDuringOpponentTurn?: boolean;
  characterDestroyedDuringOpponentPreviousTurn?: boolean;

  tyroshTradeUsedPreviousOwnTurn?: boolean;
  tyroshTradeUsedThisTurn?: boolean;

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
  | "manders-pact-draw"
  | "sunspear-poison";

export interface DelayedEffect {
  id: string;

  type: DelayedEffectType;

  triggerPlayerId: PlayerId;

  targetUnitInstanceId: string;

  remainingTriggers?: number;
}

// ─────────────────────────────────────────────
// Mandatory ability resolution
// ─────────────────────────────────────────────

export interface PendingEffectState {
  id: string;

  controllerId: PlayerId;

  sourceUnitInstanceId: string | null;

  abilityId:
    | "manders-pact"
    | "veiled-sight"
    | "iron-wrath"
    | "tyrosh";
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
  supporters?: Record<PlayerId, "mara" | "aldren">;
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

  visibility?: "public" | "owner";

  message: string;
  turnOwnerId?: PlayerId;
  chronicle?: {
    actionId: number;
    kind?: "play" | "conflict" | "effect";
    sourceCardId?: string;
    sourceInstanceId?: string;
    targetCardId?: string;
    targetInstanceId?: string;
    conflict?: "Military" | "Political";
    result?: "Victory" | "Repelled" | "Resolved";
    changes?: ChronicleStatChange[];
  };
}

export interface ChronicleStatChange {
  cardId?: string;
  instanceId?: string;
  playerId: PlayerId;
  stat: "Strength" | "Influence" | "Health" | "Max Health" | "Command" | "Standing";
  before: number;
  after: number;
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

  decline?: boolean;
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
  boardIndex?: number;
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
