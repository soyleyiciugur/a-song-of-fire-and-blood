// lib/the-great-game/engine.ts

import {
  getGameCard,
  hasTrait,
  isUnitCard,
} from "./cards";

import {
  createTestDeck,
  validateDeck,
} from "./deck";

import type {
  ActionResult,
  DelayedEffect,
  GameAction,
  GameCard,
  GameState,
  HandCardState,
  HandCostModifier,
  PlayerId,
  PlayerState,
  Trait,
  UnitState,
} from "./types";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

export const STARTING_STANDING = 30;
export const STARTING_HAND_SIZE = 5;
export const HAND_LIMIT = 8;

export const BOARD_LIMIT = 6;
export const DRAGON_BOARD_LIMIT = 2;

export const MAX_COMMAND = 10;

// ─────────────────────────────────────────────
// Basic helpers
// ─────────────────────────────────────────────

export function opponentOf(
  playerId: PlayerId
): PlayerId {
  return playerId === "player1"
    ? "player2"
    : "player1";
}

function assertRule(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function cloneState(
  state: GameState
): GameState {
  return structuredClone(state);
}

function nextRuntimeId(
  state: GameState,
  prefix: string
): string {
  const id =
    `${prefix}-${state.nextInstanceNumber}`;

  state.nextInstanceNumber += 1;

  return id;
}

function addLog(
  state: GameState,
  message: string,
  playerId?: PlayerId
) {
  state.log.push({
    id: state.log.length + 1,
    turn: state.turnNumber,
    playerId,
    message,
  });
}

function shuffle<T>(
  items: T[]
): T[] {
  const copy = [...items];

  for (
    let i = copy.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [
      copy[i],
      copy[j],
    ] = [
      copy[j],
      copy[i],
    ];
  }

  return copy;
}

// ─────────────────────────────────────────────
// Runtime lookup
// ─────────────────────────────────────────────

export function findUnit(
  state: GameState,
  instanceId: string
): UnitState | undefined {
  return (
    state.players.player1.board.find(
      (unit) =>
        unit.instanceId ===
        instanceId
    ) ??
    state.players.player2.board.find(
      (unit) =>
        unit.instanceId ===
        instanceId
    )
  );
}

export function getUnitOwner(
  state: GameState,
  instanceId: string
): PlayerId | undefined {
  const p1 =
    state.players.player1.board.some(
      (unit) =>
        unit.instanceId ===
        instanceId
    );

  if (p1) {
    return "player1";
  }

  const p2 =
    state.players.player2.board.some(
      (unit) =>
        unit.instanceId ===
        instanceId
    );

  if (p2) {
    return "player2";
  }

  return undefined;
}

function getHandCard(
  player: PlayerState,
  handInstanceId: string
): HandCardState | undefined {
  return player.hand.find(
    (card) =>
      card.instanceId ===
      handInstanceId
  );
}

function playerControlsCard(
  state: GameState,
  playerId: PlayerId,
  cardId: string
): boolean {
  return state.players[
    playerId
  ].board.some(
    (unit) =>
      unit.cardId === cardId
  );
}

// ─────────────────────────────────────────────
// Effective Traits / stats
// ─────────────────────────────────────────────

export function unitHasTrait(
  state: GameState,
  unit: UnitState,
  trait: Trait
): boolean {
  const card =
    getGameCard(unit.cardId);

  if (hasTrait(card, trait)) {
    return true;
  }

  // Dark Sister grants Challenge.
  if (
    trait === "challenge" &&
    unit.attachedArtifactId ===
      "dark-sister"
  ) {
    return true;
  }

  return false;
}

export function getEffectivePower(
  state: GameState,
  unit: UnitState
): number {
  const card =
    getGameCard(unit.cardId);

  if (!isUnitCard(card)) {
    return 0;
  }

  let power = card.power;

  for (
    const modifier of
    unit.modifiers
  ) {
    power +=
      modifier.power ?? 0;
  }

  if (
    unit.attachedArtifactId ===
    "blackfyre"
  ) {
    power += 2;
  }

  if (
    unit.attachedArtifactId ===
    "dark-sister"
  ) {
    power += 2;
  }

  return Math.max(0, power);
}

export function getEffectiveInfluence(
  state: GameState,
  unit: UnitState
): number {
  const card =
    getGameCard(unit.cardId);

  if (
    card.cardType !==
    "character"
  ) {
    return 0;
  }

  let influence =
    card.influence;

  for (
    const modifier of
    unit.modifiers
  ) {
    influence +=
      modifier.influence ?? 0;
  }

  if (
    unit.attachedArtifactId ===
    "blackfyre"
  ) {
    influence += 1;
  }

  if (
    state.activeLocation
      ?.cardId ===
    "kings-landing"
  ) {
    influence += 1;
  }

  return Math.max(
    0,
    influence
  );
}

export function getMaximumHealth(
  unit: UnitState
): number {
  const card =
    getGameCard(unit.cardId);

  if (!isUnitCard(card)) {
    return 0;
  }

  let health =
    card.health;

  for (
    const modifier of
    unit.modifiers
  ) {
    health +=
      modifier.health ?? 0;
  }

  return Math.max(
    1,
    health
  );
}

export function getEffectiveCost(
  state: GameState,
  playerId: PlayerId,
  handCard: HandCardState
): number {
  const player =
    state.players[playerId];

  const card =
    getGameCard(
      handCard.cardId
    );

  let cost = card.cost;

  // Individual hand-card modifiers.
  for (
    const modifier of
    handCard.costModifiers
  ) {
    cost += modifier.amount;
  }

  // Dragonstone.
  if (
    card.cardType === "dragon" &&
    state.activeLocation
      ?.cardId === "dragonstone"
  ) {
    cost -= 1;
  }

  // Bond — Jacaelon.
  if (
    card.id === "jhagar" &&
    playerControlsCard(
      state,
      playerId,
      "jacaelon-targaryen"
    )
  ) {
    cost -= 2;
  }

  // Bond — Saera.
  if (
    card.id ===
      "cloudgazer" &&
    playerControlsCard(
      state,
      playerId,
      "saera-targaryen"
    )
  ) {
    cost -= 2;
  }

  // Bond — Baelenys.
  if (
    card.id === "maelwing" &&
    playerControlsCard(
      state,
      playerId,
      "baelenys-targaryen"
    )
  ) {
    cost -= 2;
  }

  // Oldtown.
  if (
    card.cardType === "event" &&
    state.activeLocation
      ?.cardId === "oldtown" &&
    player.eventsPlayedThisTurn === 0
  ) {
    cost -= 1;
  }

  return Math.max(0, cost);
}

// ─────────────────────────────────────────────
// Draw / Burn
// ─────────────────────────────────────────────

interface DrawResult {
  success: boolean;
  burned: boolean;

  handInstanceId?: string;
  cardId?: string;
}

function drawCardMutable(
  state: GameState,
  playerId: PlayerId,
  options?: {
    silent?: boolean;

    costModifier?: Omit<
      HandCostModifier,
      "id"
    >;
  }
): DrawResult {
  const player =
    state.players[playerId];

  const cardId =
    player.deck.shift();

  if (!cardId) {
    if (!options?.silent) {
      addLog(
        state,
        "Could not draw: deck is empty.",
        playerId
      );
    }

    return {
      success: false,
      burned: false,
    };
  }

  // Burn.
  if (
    player.hand.length >=
    HAND_LIMIT
  ) {
    player.discard.push(cardId);

    player.burnedCards.push(
      cardId
    );

    if (!options?.silent) {
      addLog(
        state,
        `${getGameCard(cardId).name} was burned.`,
        playerId
      );
    }

    return {
      success: false,
      burned: true,
      cardId,
    };
  }

  const handCard: HandCardState =
    {
      instanceId:
        nextRuntimeId(
          state,
          "hand"
        ),

      cardId,

      costModifiers: [],
    };

  if (options?.costModifier) {
    handCard.costModifiers.push({
      id: nextRuntimeId(
        state,
        "cost-mod"
      ),

      ...options.costModifier,
    });
  }

  player.hand.push(handCard);

  if (!options?.silent) {
    addLog(
      state,
      `Drew ${getGameCard(cardId).name}.`,
      playerId
    );
  }

  return {
    success: true,
    burned: false,
    handInstanceId:
      handCard.instanceId,
    cardId,
  };
}

// ─────────────────────────────────────────────
// Standing
// ─────────────────────────────────────────────

function evaluateWinnerMutable(
  state: GameState
) {
  const player1Dead =
    state.players.player1
      .standing <= 0;

  const player2Dead =
    state.players.player2
      .standing <= 0;

  if (
    player1Dead &&
    player2Dead
  ) {
    state.winner = "draw";
    return;
  }

  if (player1Dead) {
    state.winner = "player2";
    return;
  }

  if (player2Dead) {
    state.winner = "player1";
    return;
  }

  state.winner = null;
}

function damageStandingMutable(
  state: GameState,
  playerId: PlayerId,
  amount: number,
  evaluate = true
) {
  if (amount <= 0) {
    return;
  }

  const player =
    state.players[playerId];

  player.standing =
    Math.max(
      0,
      player.standing -
        amount
    );

  addLog(
    state,
    `${playerId} loses ${amount} Standing.`,
    playerId
  );

  if (evaluate) {
    evaluateWinnerMutable(
      state
    );
  }
}

function gainStandingMutable(
  state: GameState,
  playerId: PlayerId,
  amount: number
) {
  if (amount <= 0) {
    return;
  }

  const player =
    state.players[playerId];

  player.standing =
    Math.min(
      STARTING_STANDING,
      player.standing +
        amount
    );

  addLog(
    state,
    `${playerId} gains ${amount} Standing.`,
    playerId
  );
}

// ─────────────────────────────────────────────
// Destroy / Damage / Grounded
// ─────────────────────────────────────────────

type DamageKind =
  | "military"
  | "event"
  | "ability";

interface DamageResult {
  damageDealt: number;

  destroyed: boolean;

  grounded: boolean;
}

function destroyCharacterMutable(
  state: GameState,
  unit: UnitState
) {
  const owner =
    state.players[
      unit.ownerId
    ];

  const index =
    owner.board.findIndex(
      (candidate) =>
        candidate.instanceId ===
        unit.instanceId
    );

  if (index === -1) {
    return;
  }

  const card =
    getGameCard(unit.cardId);

  assertRule(
    card.cardType ===
      "character",
    "Only Characters can be destroyed through this path."
  );

  owner.board.splice(
    index,
    1
  );

  owner.discard.push(
    unit.cardId
  );

  if (
    unit.attachedArtifactId
  ) {
    owner.discard.push(
      unit.attachedArtifactId
    );
  }

  addLog(
    state,
    `${card.name} was destroyed.`,
    unit.ownerId
  );

  // FALL abilities will resolve here
  // once FALL cards enter the pool.
}

function damageUnitMutable(
  state: GameState,
  instanceId: string,
  amount: number,
  kind: DamageKind
): DamageResult {
  const unit =
    findUnit(
      state,
      instanceId
    );

  if (
    !unit ||
    amount <= 0
  ) {
    return {
      damageDealt: 0,
      destroyed: false,
      grounded: false,
    };
  }

  const card =
    getGameCard(unit.cardId);

  assertRule(
    isUnitCard(card),
    "Damage target must be a Character or Dragon."
  );

  let finalDamage = amount;

  // Dawn's Edge.
  if (
    card.id ===
      "alester-dayne" &&
    kind === "military"
  ) {
    const alreadyPrevented =
      unit.counters[
        "dawns-edge-prevented"
      ] ?? 0;

    const remainingPrevention =
      Math.max(
        0,
        2 -
          alreadyPrevented
      );

    const prevented =
      Math.min(
        remainingPrevention,
        finalDamage
      );

    finalDamage -= prevented;

    unit.counters[
      "dawns-edge-prevented"
    ] =
      alreadyPrevented +
      prevented;

    if (prevented > 0) {
      addLog(
        state,
        `Dawn's Edge prevented ${prevented} Military damage.`
      );
    }
  }

  if (finalDamage <= 0) {
    return {
      damageDealt: 0,
      destroyed: false,
      grounded: false,
    };
  }

  unit.currentHealth =
    Math.max(
      0,
      unit.currentHealth -
        finalDamage
    );

  addLog(
    state,
    `${card.name} takes ${finalDamage} damage.`
  );

  // Dragon → Grounded.
  if (
    card.cardType ===
      "dragon" &&
    unit.currentHealth <= 0
  ) {
    const newlyGrounded =
      !unit.grounded;

    unit.currentHealth = 0;
    unit.grounded = true;

    if (newlyGrounded) {
      addLog(
        state,
        `${card.name} becomes Grounded.`
      );
    }

    return {
      damageDealt:
        finalDamage,

      destroyed: false,

      grounded: true,
    };
  }

  // Character → destroyed.
  if (
    card.cardType ===
      "character" &&
    unit.currentHealth <= 0
  ) {
    destroyCharacterMutable(
      state,
      unit
    );

    return {
      damageDealt:
        finalDamage,

      destroyed: true,

      grounded: false,
    };
  }

  return {
    damageDealt:
      finalDamage,

    destroyed: false,

    grounded: false,
  };
}

// ─────────────────────────────────────────────
// Character target helpers
// ─────────────────────────────────────────────

function enemyCharacters(
  state: GameState,
  playerId: PlayerId
): UnitState[] {
  const enemyId =
    opponentOf(playerId);

  return state.players[
    enemyId
  ].board.filter(
    (unit) =>
      getGameCard(unit.cardId)
        .cardType ===
      "character"
  );
}

function allCharacters(
  state: GameState
): UnitState[] {
  return [
    ...state.players.player1
      .board,

    ...state.players.player2
      .board,
  ].filter(
    (unit) =>
      getGameCard(unit.cardId)
        .cardType ===
      "character"
  );
}

// ─────────────────────────────────────────────
// Military target options
// ─────────────────────────────────────────────

export interface MilitaryTargetOptions {
  unitInstanceIds: string[];

  canAttackStanding: boolean;
}

export function getMilitaryTargetOptions(
  state: GameState,
  attackerInstanceId: string
): MilitaryTargetOptions {
  const attacker =
    findUnit(
      state,
      attackerInstanceId
    );

  if (!attacker) {
    return {
      unitInstanceIds: [],
      canAttackStanding: false,
    };
  }

  const enemyId =
    opponentOf(
      attacker.ownerId
    );

  const enemyBoard =
    state.players[
      enemyId
    ].board;

  const guards =
    enemyBoard.filter(
      (unit) => {
        // Grounded Dragons cannot
        // function as defenders.
        if (unit.grounded) {
          return false;
        }

        return unitHasTrait(
          state,
          unit,
          "guard"
        );
      }
    );

  const hasChallenge =
    unitHasTrait(
      state,
      attacker,
      "challenge"
    );

  // Guard blocks everything except
  // Challenge targeting another unit.
  if (
    guards.length > 0 &&
    !hasChallenge
  ) {
    return {
      unitInstanceIds:
        guards.map(
          (unit) =>
            unit.instanceId
        ),

      canAttackStanding:
        false,
    };
  }

  return {
    unitInstanceIds:
      enemyBoard.map(
        (unit) =>
          unit.instanceId
      ),

    // Challenge may bypass Guard
    // to target another unit,
    // but not Standing.
    canAttackStanding:
      guards.length === 0,
  };
}

// ─────────────────────────────────────────────
// Political defense options
// ─────────────────────────────────────────────

export interface PoliticalDefenseOptions {
  unopposed: boolean;

  defenderInstanceIds:
    string[];

  selectionBy:
    | "attacker"
    | "defender"
    | "none";
}

export function getPoliticalDefenseOptions(
  state: GameState,
  attackerInstanceId: string
): PoliticalDefenseOptions {
  const attacker =
    findUnit(
      state,
      attackerInstanceId
    );

  if (!attacker) {
    return {
      unopposed: false,
      defenderInstanceIds: [],
      selectionBy: "none",
    };
  }

  const defenderPlayerId =
    opponentOf(
      attacker.ownerId
    );

  const readyCharacters =
    state.players[
      defenderPlayerId
    ].board.filter(
      (unit) => {
        const card =
          getGameCard(
            unit.cardId
          );

        return (
          card.cardType ===
            "character" &&
          !unit.exhausted
        );
      }
    );

  // No ready political defense.
  if (
    readyCharacters.length ===
    0
  ) {
    return {
      unopposed: true,
      defenderInstanceIds: [],
      selectionBy: "none",
    };
  }

  // Confront ignores Intrigue and
  // lets attacker pick any ready
  // Character.
  if (
    unitHasTrait(
      state,
      attacker,
      "confront"
    )
  ) {
    return {
      unopposed: false,

      defenderInstanceIds:
        readyCharacters.map(
          (unit) =>
            unit.instanceId
        ),

      selectionBy:
        "attacker",
    };
  }

  const intrigueCharacters =
    readyCharacters.filter(
      (unit) =>
        unitHasTrait(
          state,
          unit,
          "intrigue"
        )
    );

  // Intrigue exists:
  // attacker chooses among them.
  if (
    intrigueCharacters.length >
    0
  ) {
    return {
      unopposed: false,

      defenderInstanceIds:
        intrigueCharacters.map(
          (unit) =>
            unit.instanceId
        ),

      selectionBy:
        "attacker",
    };
  }

  // Normal Political defense:
  // defending player chooses.
  return {
    unopposed: false,

    defenderInstanceIds:
      readyCharacters.map(
        (unit) =>
          unit.instanceId
      ),

    selectionBy:
      "defender",
  };
}

// ─────────────────────────────────────────────
// Play target validation
// ─────────────────────────────────────────────

function validatePlayTargets(
  state: GameState,
  playerId: PlayerId,
  card: GameCard,
  action: Extract<
    GameAction,
    { type: "play-card" }
  >
) {
  const enemyId =
    opponentOf(playerId);

  // ── Artifact ──

  if (
    card.cardType ===
    "artifact"
  ) {
    assertRule(
      Boolean(
        action.targetInstanceId
      ),
      `${card.name} requires a Character target.`
    );

    const target =
      findUnit(
        state,
        action.targetInstanceId!
      );

    assertRule(
      Boolean(target),
      "Artifact target does not exist."
    );

    assertRule(
      target!.ownerId ===
        playerId,
      "Artifacts can only be equipped to Characters you control."
    );

    assertRule(
      getGameCard(
        target!.cardId
      ).cardType ===
        "character",
      "Artifacts can only be equipped to Characters."
    );

    assertRule(
      !target!
        .attachedArtifactId,
      "That Character already has an Artifact."
    );
  }

  // ── Mander's Pact ──

  if (
    card.id ===
    "renrose-tyrell"
  ) {
    const possibleTargets =
      allCharacters(state);

    // "another Character":
    // neutral targeting is intentional.
    if (
      possibleTargets.length > 0
    ) {
      assertRule(
        Boolean(
          action.targetInstanceId
        ),
        "The Mander's Pact requires another Character target."
      );

      const target =
        findUnit(
          state,
          action.targetInstanceId!
        );

      assertRule(
        Boolean(target),
        "The Mander's Pact target does not exist."
      );

      assertRule(
        getGameCard(
          target!.cardId
        ).cardType ===
          "character",
        "The Mander's Pact target must be a Character."
      );
    }
  }

  // ── Veiled Sight ──

  if (
    card.id ===
    "saera-targaryen"
  ) {
    const enemyHand =
      state.players[
        enemyId
      ].hand;

    if (
      enemyHand.length > 0
    ) {
      assertRule(
        Boolean(
          action.targetHandInstanceId
        ),
        "Veiled Sight requires a card from your opponent's hand."
      );

      assertRule(
        enemyHand.some(
          (handCard) =>
            handCard.instanceId ===
            action.targetHandInstanceId
        ),
        "Veiled Sight target is not in the opponent's hand."
      );
    }
  }

  // ── Iron Wrath ──

  if (
    card.id ===
    "baelenys-targaryen"
  ) {
    const targets =
      enemyCharacters(
        state,
        playerId
      );

    if (
      targets.length > 0
    ) {
      assertRule(
        Boolean(
          action.targetInstanceId
        ),
        "Iron Wrath requires an enemy Character target."
      );

      const target =
        findUnit(
          state,
          action.targetInstanceId!
        );

      assertRule(
        Boolean(target),
        "Iron Wrath target does not exist."
      );

      assertRule(
        target!.ownerId ===
          enemyId,
        "Iron Wrath must target an enemy Character."
      );

      assertRule(
        getGameCard(
          target!.cardId
        ).cardType ===
          "character",
        "Iron Wrath must target an enemy Character."
      );
    }
  }

  // ── Trial by Combat ──

  if (
    card.id ===
    "trial-by-combat"
  ) {
    assertRule(
      Boolean(
        action.targetInstanceId
      ) &&
        Boolean(
          action.secondaryTargetInstanceId
        ),
      "Trial by Combat requires two Character targets."
    );

    const allied =
      findUnit(
        state,
        action.targetInstanceId!
      );

    const enemy =
      findUnit(
        state,
        action.secondaryTargetInstanceId!
      );

    assertRule(
      Boolean(allied),
      "Trial by Combat allied target does not exist."
    );

    assertRule(
      Boolean(enemy),
      "Trial by Combat enemy target does not exist."
    );

    assertRule(
      allied!.ownerId ===
        playerId &&
        getGameCard(
          allied!.cardId
        ).cardType ===
          "character",
      "Trial by Combat's first target must be a Character you control."
    );

    assertRule(
      enemy!.ownerId ===
        enemyId &&
        getGameCard(
          enemy!.cardId
        ).cardType ===
          "character",
      "Trial by Combat's second target must be an enemy Character."
    );
  }

  // ── Brothers' Tilt ──

  if (
    card.id ===
    "brothers-tilt"
  ) {
    assertRule(
      Boolean(
        action.targetInstanceId
      ),
      "The Brothers' Tilt requires a Character target."
    );

    const target =
      findUnit(
        state,
        action.targetInstanceId!
      );

    assertRule(
      Boolean(target),
      "The Brothers' Tilt target does not exist."
    );

    assertRule(
      target!.ownerId ===
        playerId &&
        getGameCard(
          target!.cardId
        ).cardType ===
          "character",
      "The Brothers' Tilt must target a Character you control."
    );
  }
}

// ─────────────────────────────────────────────
// Arrival abilities
// ─────────────────────────────────────────────

function resolveArrivalMutable(
  state: GameState,
  playerId: PlayerId,
  unit: UnitState,
  action: Extract<
    GameAction,
    { type: "play-card" }
  >
) {
  const card =
    getGameCard(
      unit.cardId
    );

  // ── The Mander's Pact ──

  if (
    card.id ===
      "renrose-tyrell" &&
    action.targetInstanceId
  ) {
    const target =
      findUnit(
        state,
        action.targetInstanceId
      );

    if (target) {
      target.modifiers.push({
        id: nextRuntimeId(
          state,
          "modifier"
        ),

        influence: 2,

        permanent: true,
      });

      state.delayedEffects.push({
        id: nextRuntimeId(
          state,
          "delayed"
        ),

        type:
          "manders-pact-draw",

        triggerPlayerId:
          playerId,

        targetUnitInstanceId:
          target.instanceId,
      });

      addLog(
        state,
        `${getGameCard(target.cardId).name} gains +2 Influence permanently from The Mander's Pact.`,
        playerId
      );
    }
  }

  // ── Veiled Sight ──

  if (
    card.id ===
      "saera-targaryen" &&
    action.targetHandInstanceId
  ) {
    const enemyId =
      opponentOf(playerId);

    const target =
      getHandCard(
        state.players[
          enemyId
        ],
        action.targetHandInstanceId
      );

    if (target) {
      target.costModifiers.push({
        id: nextRuntimeId(
          state,
          "cost-mod"
        ),

        amount: 2,

        expiresAt:
          "start-of-player-turn",

        // Saera controller's
        // next turn.
        expiresForPlayerId:
          playerId,
      });

      addLog(
        state,
        `Veiled Sight increases ${getGameCard(target.cardId).name}'s cost by 2 Command.`,
        playerId
      );
    }
  }

  // ── Iron Wrath ──

  if (
    card.id ===
      "baelenys-targaryen" &&
    action.targetInstanceId
  ) {
    const result =
      damageUnitMutable(
        state,
        action.targetInstanceId,
        3,
        "ability"
      );

    if (
      result.destroyed
    ) {
      gainStandingMutable(
        state,
        playerId,
        3
      );
    }
  }
}

// ─────────────────────────────────────────────
// Events
// ─────────────────────────────────────────────

function resolveEventMutable(
  state: GameState,
  playerId: PlayerId,
  card: GameCard,
  action: Extract<
    GameAction,
    { type: "play-card" }
  >
) {
  // ── Trial by Combat ──

  if (
    card.id ===
    "trial-by-combat"
  ) {
    const allied =
      findUnit(
        state,
        action.targetInstanceId!
      )!;

    const enemy =
      findUnit(
        state,
        action.secondaryTargetInstanceId!
      )!;

    // Snapshot values before
    // simultaneous damage.
    const alliedPower =
      getEffectivePower(
        state,
        allied
      );

    const enemyPower =
      getEffectivePower(
        state,
        enemy
      );

    damageUnitMutable(
      state,
      allied.instanceId,
      enemyPower,
      "military"
    );

    damageUnitMutable(
      state,
      enemy.instanceId,
      alliedPower,
      "military"
    );

    return;
  }

  // ── Oldtown Massacre ──

  if (
    card.id ===
    "oldtown-massacre"
  ) {
    const unitIds = [
      ...state.players.player1
        .board,

      ...state.players.player2
        .board,
    ].map(
      (unit) =>
        unit.instanceId
    );

    // Snapshot IDs first because
    // Characters may leave board
    // during resolution.
    for (
      const instanceId of
      unitIds
    ) {
      if (
        findUnit(
          state,
          instanceId
        )
      ) {
        damageUnitMutable(
          state,
          instanceId,
          2,
          "event"
        );
      }
    }

    // Both Standing hits are
    // treated simultaneously.
    damageStandingMutable(
      state,
      "player1",
      2,
      false
    );

    damageStandingMutable(
      state,
      "player2",
      2,
      false
    );

    evaluateWinnerMutable(
      state
    );

    return;
  }

  // ── The Brothers' Tilt ──

  if (
    card.id ===
    "brothers-tilt"
  ) {
    const target =
      findUnit(
        state,
        action.targetInstanceId!
      )!;

    const targetPower =
      getEffectivePower(
        state,
        target
      );

    const enemyId =
      opponentOf(playerId);

    const weakerReadyEnemies =
      state.players[
        enemyId
      ].board.filter(
        (enemy) => {
          const enemyCard =
            getGameCard(
              enemy.cardId
            );

          if (
            enemyCard.cardType !==
            "character"
          ) {
            return false;
          }

          if (
            enemy.exhausted
          ) {
            return false;
          }

          return (
            targetPower >
            getEffectivePower(
              state,
              enemy
            )
          );
        }
      );

    const bonus =
      Math.min(
        3,
        weakerReadyEnemies
          .length
      );

    if (bonus > 0) {
      target.modifiers.push({
        id: nextRuntimeId(
          state,
          "modifier"
        ),

        power: bonus,

        permanent: true,
      });
    }

    target.exhausted = true;

    addLog(
      state,
      `${getGameCard(target.cardId).name} gains +${bonus} Power from The Brothers' Tilt and becomes Exhausted.`,
      playerId
    );

    return;
  }
}

// ─────────────────────────────────────────────
// Play card
// ─────────────────────────────────────────────

function playCardMutable(
  state: GameState,
  action: Extract<
    GameAction,
    { type: "play-card" }
  >
) {
  const playerId =
    state.activePlayerId;

  const player =
    state.players[
      playerId
    ];

  const handIndex =
    player.hand.findIndex(
      (handCard) =>
        handCard.instanceId ===
        action.handInstanceId
    );

  assertRule(
    handIndex !== -1,
    "That card is not in your hand."
  );

  const handCard =
    player.hand[
      handIndex
    ];

  const card =
    getGameCard(
      handCard.cardId
    );

  // ── Board capacity ──

  if (isUnitCard(card)) {
    assertRule(
      player.board.length <
        BOARD_LIMIT,
      "Your board is full."
    );

    if (
      card.cardType ===
      "dragon"
    ) {
      const dragonCount =
        player.board.filter(
          (unit) =>
            getGameCard(
              unit.cardId
            ).cardType ===
            "dragon"
        ).length;

      assertRule(
        dragonCount <
          DRAGON_BOARD_LIMIT,
        "You already control the maximum number of Dragons."
      );
    }
  }

  // ── Unique in play ──

  if (
    hasTrait(
      card,
      "unique"
    )
  ) {
    const duplicateUnit =
      player.board.some(
        (unit) =>
          unit.cardId ===
          card.id
      );

    const duplicateArtifact =
      player.board.some(
        (unit) =>
          unit.attachedArtifactId ===
          card.id
      );

    assertRule(
      !duplicateUnit &&
        !duplicateArtifact,
      `${card.name} is Unique and is already in play under your control.`
    );
  }

  // Validate all targets before
  // spending Command.
  validatePlayTargets(
    state,
    playerId,
    card,
    action
  );

  const cost =
    getEffectiveCost(
      state,
      playerId,
      handCard
    );

  assertRule(
    player.command >= cost,
    `Not enough Command. ${card.name} costs ${cost}.`
  );

  // Pay.
  player.command -= cost;

  // Remove exact hand instance.
  player.hand.splice(
    handIndex,
    1
  );

  addLog(
    state,
    `Played ${card.name} for ${cost} Command.`,
    playerId
  );

  // ───────────────────────────────────────────
  // Character / Dragon
  // ───────────────────────────────────────────

  if (isUnitCard(card)) {
    const unit: UnitState = {
      instanceId:
        nextRuntimeId(
          state,
          "unit"
        ),

      cardId:
        card.id,

      ownerId:
        playerId,

      currentHealth:
        card.health,

      // New units are technically
      // Ready, but deployment stops
      // normal attacks this turn.
      exhausted: false,

      deployedThisTurn:
        true,

      grounded: false,

      attachedArtifactId:
        null,

      modifiers: [],

      counters: {},

      flags: {},
    };

    player.board.push(unit);

    if (
      card.cardType ===
      "character"
    ) {
      resolveArrivalMutable(
        state,
        playerId,
        unit,
        action
      );
    }

    evaluateWinnerMutable(
      state
    );

    return;
  }

  // ───────────────────────────────────────────
  // Event
  // ───────────────────────────────────────────

  if (
    card.cardType ===
    "event"
  ) {
    player.eventsPlayedThisTurn +=
      1;

    resolveEventMutable(
      state,
      playerId,
      card,
      action
    );

    player.discard.push(
      card.id
    );

    evaluateWinnerMutable(
      state
    );

    return;
  }

  // ───────────────────────────────────────────
  // Artifact
  // ───────────────────────────────────────────

  if (
    card.cardType ===
    "artifact"
  ) {
    const target =
      findUnit(
        state,
        action.targetInstanceId!
      );

    assertRule(
      Boolean(target),
      "Artifact target disappeared."
    );

    target!
      .attachedArtifactId =
      card.id;

    addLog(
      state,
      `${card.name} equipped to ${getGameCard(target!.cardId).name}.`,
      playerId
    );

    return;
  }

  // ───────────────────────────────────────────
  // Location
  // ───────────────────────────────────────────

  if (
    card.cardType ===
    "location"
  ) {
    if (
      state.activeLocation
    ) {
      const oldLocation =
        state.activeLocation;

      state.players[
        oldLocation.playedBy
      ].discard.push(
        oldLocation.cardId
      );

      addLog(
        state,
        `${getGameCard(oldLocation.cardId).name} is replaced.`
      );
    }

    state.activeLocation = {
      cardId: card.id,
      playedBy: playerId,
    };

    addLog(
      state,
      `${card.name} becomes the active Location.`,
      playerId
    );

    return;
  }
}

// ─────────────────────────────────────────────
// Military Conflict
// ─────────────────────────────────────────────

function militaryAttackMutable(
  state: GameState,
  action: Extract<
    GameAction,
    { type: "military-attack" }
  >
) {
  const playerId =
    state.activePlayerId;

  const enemyId =
    opponentOf(playerId);

  const attacker =
    findUnit(
      state,
      action.attackerInstanceId
    );

  assertRule(
    Boolean(attacker),
    "Attacker does not exist."
  );

  assertRule(
    attacker!.ownerId ===
      playerId,
    "You do not control that attacker."
  );

  assertRule(
    !attacker!.exhausted,
    "That unit is Exhausted."
  );

  assertRule(
    !attacker!.grounded,
    "A Grounded Dragon cannot attack."
  );

  // Deployment restriction.
  if (
    attacker!
      .deployedThisTurn
  ) {
    assertRule(
      unitHasTrait(
        state,
        attacker!,
        "swift"
      ),
      "That unit cannot make a Military Attack on the turn it enters play."
    );
  }

  const options =
    getMilitaryTargetOptions(
      state,
      attacker!
        .instanceId
    );

  const targetingPlayer =
    Boolean(
      action.targetPlayerId
    );

  const targetingUnit =
    Boolean(
      action.targetUnitInstanceId
    );

  assertRule(
    targetingPlayer !==
      targetingUnit,
    "Military Attack must target exactly one enemy unit or Standing."
  );

  // ── Direct Standing attack ──

  if (
    action.targetPlayerId
  ) {
    assertRule(
      action.targetPlayerId ===
        enemyId,
      "You can only attack the opposing player's Standing."
    );

    assertRule(
      options.canAttackStanding,
      "Guard prevents a direct Military Attack."
    );

    attacker!.exhausted =
      true;

    const damage =
      getEffectivePower(
        state,
        attacker!
      );

    damageStandingMutable(
      state,
      enemyId,
      damage
    );

    return;
  }

  // ── Unit target ──

  const target =
    findUnit(
      state,
      action.targetUnitInstanceId!
    );

  assertRule(
    Boolean(target),
    "Military target does not exist."
  );

  assertRule(
    target!.ownerId ===
      enemyId,
    "You can only attack enemy units."
  );

  assertRule(
    options
      .unitInstanceIds
      .includes(
        target!.instanceId
      ),
    "That unit cannot currently be targeted by this Military Attack."
  );

  const attackerPower =
    getEffectivePower(
      state,
      attacker!
    );

  const targetPower =
    getEffectivePower(
      state,
      target!
    );

  const targetWasGrounded =
    target!.grounded;

  const targetCard =
    getGameCard(
      target!.cardId
    );

  attacker!.exhausted =
    true;

  // Snapshot Power values first,
  // then resolve simultaneous combat.

  const targetDamageResult =
    damageUnitMutable(
      state,
      target!.instanceId,
      attackerPower,
      "military"
    );

  // Grounded Dragons cannot defend.
  if (
    !targetWasGrounded
  ) {
    damageUnitMutable(
      state,
      attacker!.instanceId,
      targetPower,
      "military"
    );
  }

  // Housebreaker.
  if (
    attacker!.cardId ===
      "gaelor-targaryen" &&
    targetCard.cardType ===
      "character" &&
    targetDamageResult
      .destroyed
  ) {
    damageStandingMutable(
      state,
      enemyId,
      2
    );
  }

  evaluateWinnerMutable(
    state
  );
}

// ─────────────────────────────────────────────
// Political Conflict
// ─────────────────────────────────────────────

function resolveSilentVerdictMutable(
  state: GameState,
  attacker: UnitState
) {
  if (
    attacker.cardId !==
    "jacaelon-targaryen"
  ) {
    return;
  }

  const enemyId =
    opponentOf(
      attacker.ownerId
    );

  damageStandingMutable(
    state,
    enemyId,
    2
  );

  addLog(
    state,
    "Silent Verdict deals 2 additional Standing damage.",
    attacker.ownerId
  );
}

function politicalAttackMutable(
  state: GameState,
  action: Extract<
    GameAction,
    { type: "political-attack" }
  >
) {
  const playerId =
    state.activePlayerId;

  const enemyId =
    opponentOf(playerId);

  const attacker =
    findUnit(
      state,
      action.attackerInstanceId
    );

  assertRule(
    Boolean(attacker),
    "Political attacker does not exist."
  );

  assertRule(
    attacker!.ownerId ===
      playerId,
    "You do not control that Character."
  );

  const attackerCard =
    getGameCard(
      attacker!.cardId
    );

  assertRule(
    attackerCard.cardType ===
      "character",
    "Only Characters can initiate Political Conflicts."
  );

  assertRule(
    !attacker!.exhausted,
    "That Character is Exhausted."
  );

  // Deployment restriction.
  if (
    attacker!
      .deployedThisTurn
  ) {
    assertRule(
      unitHasTrait(
        state,
        attacker!,
        "schemer"
      ),
      "That Character cannot make a Political Attack on the turn it enters play."
    );
  }

  const defense =
    getPoliticalDefenseOptions(
      state,
      attacker!
        .instanceId
    );

  const attackerInfluence =
    getEffectiveInfluence(
      state,
      attacker!
    );

  attacker!.exhausted =
    true;

  // ── Unopposed ──

  if (
    defense.unopposed
  ) {
    if (
      attackerInfluence > 0
    ) {
      damageStandingMutable(
        state,
        enemyId,
        attackerInfluence
      );

      // Political Victory.
      resolveSilentVerdictMutable(
        state,
        attacker!
      );
    }

    evaluateWinnerMutable(
      state
    );

    return;
  }

  let defenderInstanceId =
    action.defenderInstanceId;

  // Auto-select if there is
  // only one legal defender.
  if (
    !defenderInstanceId &&
    defense
      .defenderInstanceIds
      .length === 1
  ) {
    defenderInstanceId =
      defense
        .defenderInstanceIds[0];
  }

  assertRule(
    Boolean(
      defenderInstanceId
    ),
    defense.selectionBy ===
      "defender"
      ? "The defending player must choose a Political defender."
      : "The attacking player must choose a Political defender."
  );

  assertRule(
    defense
      .defenderInstanceIds
      .includes(
        defenderInstanceId!
      ),
    "That Character is not a legal Political defender."
  );

  const defender =
    findUnit(
      state,
      defenderInstanceId!
    );

  assertRule(
    Boolean(defender),
    "Political defender no longer exists."
  );

  assertRule(
    !defender!.exhausted,
    "Political defender must be Ready."
  );

  defender!.exhausted =
    true;

  const defenderInfluence =
    getEffectiveInfluence(
      state,
      defender!
    );

  const difference =
    attackerInfluence -
    defenderInfluence;

  if (difference > 0) {
    damageStandingMutable(
      state,
      enemyId,
      difference
    );

    // Attacker won Political Conflict.
    resolveSilentVerdictMutable(
      state,
      attacker!
    );
  }

  addLog(
    state,
    `${attackerCard.name} (${attackerInfluence} Influence) faced ${getGameCard(defender!.cardId).name} (${defenderInfluence} Influence).`,
    playerId
  );

  evaluateWinnerMutable(
    state
  );
}

// ─────────────────────────────────────────────
// Hand modifier expiration
// ─────────────────────────────────────────────

function expireHandModifiersAtStart(
  state: GameState,
  playerId: PlayerId
) {
  for (
    const ownerId of [
      "player1",
      "player2",
    ] as PlayerId[]
  ) {
    for (
      const handCard of
      state.players[
        ownerId
      ].hand
    ) {
      handCard.costModifiers =
        handCard
          .costModifiers
          .filter(
            (modifier) =>
              !(
                modifier.expiresAt ===
                  "start-of-player-turn" &&
                modifier
                  .expiresForPlayerId ===
                  playerId
              )
          );
    }
  }
}

function expireHandModifiersAtEnd(
  state: GameState,
  playerId: PlayerId
) {
  for (
    const ownerId of [
      "player1",
      "player2",
    ] as PlayerId[]
  ) {
    for (
      const handCard of
      state.players[
        ownerId
      ].hand
    ) {
      handCard.costModifiers =
        handCard
          .costModifiers
          .filter(
            (modifier) =>
              !(
                modifier.expiresAt ===
                  "end-of-player-turn" &&
                modifier
                  .expiresForPlayerId ===
                  playerId
              )
          );
    }
  }
}

// ─────────────────────────────────────────────
// Mander's Pact delayed draw
// ─────────────────────────────────────────────

function processManderDelayedEffects(
  state: GameState,
  playerId: PlayerId
) {
  const remaining:
    DelayedEffect[] = [];

  for (
    const effect of
    state.delayedEffects
  ) {
    if (
      effect.triggerPlayerId !==
      playerId
    ) {
      remaining.push(effect);
      continue;
    }

    if (
      effect.type ===
      "manders-pact-draw"
    ) {
      const target =
        findUnit(
          state,
          effect
            .targetUnitInstanceId
        );

      // Only draw if exact target
      // is still in play.
      if (target) {
        drawCardMutable(
          state,
          playerId
        );
      }
    }
  }

  state.delayedEffects =
    remaining;
}

// ─────────────────────────────────────────────
// Cordin
// ─────────────────────────────────────────────

function processCordinStartOfTurn(
  state: GameState,
  playerId: PlayerId
) {
  const cordins =
    state.players[
      playerId
    ].board.filter(
      (unit) =>
        unit.cardId ===
        "cordin-poole"
    );

  for (
    const cordin of
    cordins
  ) {
    const previousSuccessfulDraw =
      cordin.flags[
        "cordin-previous-draw-successful"
      ] ?? false;

    const result =
      drawCardMutable(
        state,
        playerId
      );

    if (
      previousSuccessfulDraw &&
      result.success &&
      result.handInstanceId
    ) {
      const drawnCard =
        getHandCard(
          state.players[
            playerId
          ],
          result.handInstanceId
        );

      drawnCard
        ?.costModifiers
        .push({
          id: nextRuntimeId(
            state,
            "cost-mod"
          ),

          amount: -1,

          expiresAt:
            "end-of-player-turn",

          expiresForPlayerId:
            playerId,
        });

      if (
        result.cardId
      ) {
        addLog(
          state,
          `${getGameCard(result.cardId).name} costs 1 less this turn due to As I Was Saying.`,
          playerId
        );
      }
    }

    // Burn / failed draw = false.
    cordin.flags[
      "cordin-previous-draw-successful"
    ] =
      result.success;
  }
}

// ─────────────────────────────────────────────
// Grounded Dragon recovery
// ─────────────────────────────────────────────

function recoverGroundedDragons(
  state: GameState,
  playerId: PlayerId
) {
  for (
    const unit of
    state.players[
      playerId
    ].board
  ) {
    const card =
      getGameCard(
        unit.cardId
      );

    if (
      card.cardType !==
        "dragon" ||
      !unit.grounded
    ) {
      continue;
    }

    const maximum =
      getMaximumHealth(
        unit
      );

    unit.currentHealth =
      Math.min(
        maximum,
        unit.currentHealth + 1
      );

    const threshold =
      Math.ceil(
        maximum / 2
      );

    addLog(
      state,
      `${card.name} recovers to ${unit.currentHealth}/${maximum} Health.`,
      playerId
    );

    if (
      unit.currentHealth >=
      threshold
    ) {
      unit.grounded = false;

      addLog(
        state,
        `${card.name} is no longer Grounded.`,
        playerId
      );
    }
  }
}

// ─────────────────────────────────────────────
// Per-turn counters
// ─────────────────────────────────────────────

function resetPerTurnCounters(
  state: GameState
) {
  for (
    const ownerId of [
      "player1",
      "player2",
    ] as PlayerId[]
  ) {
    for (
      const unit of
      state.players[
        ownerId
      ].board
    ) {
      unit.counters[
        "dawns-edge-prevented"
      ] = 0;
    }
  }
}

// ─────────────────────────────────────────────
// Weylar
// ─────────────────────────────────────────────

function processWeylarEndOfTurn(
  state: GameState,
  playerId: PlayerId
) {
  const weylars =
    state.players[
      playerId
    ].board.filter(
      (unit) =>
        unit.cardId ===
        "weylar-rocke"
    );

  for (
    const weylar of
    weylars
  ) {
    if (
      weylar.flags[
        "weylar-triggered"
      ]
    ) {
      continue;
    }

    const turns =
      (
        weylar.counters[
          "turns-in-play"
        ] ?? 0
      ) + 1;

    weylar.counters[
      "turns-in-play"
    ] = turns;

    if (turns === 3) {
      drawCardMutable(
        state,
        playerId
      );

      drawCardMutable(
        state,
        playerId
      );

      state.players[
        playerId
      ].nextCommandBonus +=
        2;

      weylar.flags[
        "weylar-triggered"
      ] = true;

      addLog(
        state,
        "The Price of Loyalty triggers: draw 2 cards and gain 2 Command next turn.",
        playerId
      );
    }
  }
}

// ─────────────────────────────────────────────
// Start Turn
// ─────────────────────────────────────────────

function startTurnMutable(
  state: GameState,
  playerId: PlayerId
) {
  const player =
    state.players[
      playerId
    ];

  state.activePlayerId =
    playerId;

  player.eventsPlayedThisTurn =
    0;

  // ── READY ──

  for (
    const unit of
    player.board
  ) {
    unit.exhausted = false;
  }

  // Dawn's Edge is "each turn",
  // so reset globally.
  resetPerTurnCounters(
    state
  );

  // Effects expiring at this
  // player's Start of Turn.
  expireHandModifiersAtStart(
    state,
    playerId
  );

  // Grounded recovery.
  recoverGroundedDragons(
    state,
    playerId
  );

  // Delayed start-of-turn
  // effects.
  processManderDelayedEffects(
    state,
    playerId
  );

  // Character Start of Turn
  // abilities.
  processCordinStartOfTurn(
    state,
    playerId
  );

  // ── NORMAL DRAW ──

  drawCardMutable(
    state,
    playerId
  );

  // ── COMMAND ──

  player.maxCommand =
    Math.min(
      MAX_COMMAND,
      player.maxCommand + 1
    );

  player.command =
    Math.min(
      MAX_COMMAND,
      player.maxCommand +
        player.nextCommandBonus
    );

  player.nextCommandBonus =
    0;

  addLog(
    state,
    `Turn begins with ${player.command} Command.`,
    playerId
  );
}

// ─────────────────────────────────────────────
// End Turn
// ─────────────────────────────────────────────

function endTurnMutable(
  state: GameState
) {
  const playerId =
    state.activePlayerId;

  processWeylarEndOfTurn(
    state,
    playerId
  );

  expireHandModifiersAtEnd(
    state,
    playerId
  );

  // Deployment sickness expires
  // at the END of controller's
  // current turn.
  //
  // Units that actually attacked
  // remain Exhausted.
  for (
    const unit of
    state.players[
      playerId
    ].board
  ) {
    unit.deployedThisTurn =
      false;
  }

  const nextPlayerId =
    opponentOf(playerId);

  state.turnNumber += 1;

  startTurnMutable(
    state,
    nextPlayerId
  );
}

// ─────────────────────────────────────────────
// Game creation
// ─────────────────────────────────────────────

function createPlayer(
  id: PlayerId,
  deck: string[]
): PlayerState {
  return {
    id,

    standing:
      STARTING_STANDING,

    maxCommand: 0,

    command: 0,

    nextCommandBonus: 0,

    deck: shuffle(deck),

    hand: [],

    discard: [],

    board: [],

    burnedCards: [],

    eventsPlayedThisTurn:
      0,
  };
}

export function createGame(
  player1Deck:
    string[] =
    createTestDeck(),

  player2Deck:
    string[] =
    createTestDeck()
): GameState {
  const player1Validation =
    validateDeck(
      player1Deck
    );

  const player2Validation =
    validateDeck(
      player2Deck
    );

  if (
    !player1Validation.valid
  ) {
    throw new Error(
      `Player 1 deck invalid:\n${player1Validation.errors.join("\n")}`
    );
  }

  if (
    !player2Validation.valid
  ) {
    throw new Error(
      `Player 2 deck invalid:\n${player2Validation.errors.join("\n")}`
    );
  }

  const state: GameState = {
    turnNumber: 1,

    activePlayerId:
      "player1",

    players: {
      player1:
        createPlayer(
          "player1",
          player1Deck
        ),

      player2:
        createPlayer(
          "player2",
          player2Deck
        ),
    },

    activeLocation: null,

    delayedEffects: [],

    winner: null,

    log: [],

    nextInstanceNumber: 1,
  };

  // Starting hand:
  // exactly 5 cards each.
  for (
    let index = 0;
    index <
    STARTING_HAND_SIZE;
    index++
  ) {
    drawCardMutable(
      state,
      "player1",
      { silent: true }
    );

    drawCardMutable(
      state,
      "player2",
      { silent: true }
    );
  }

  addLog(
    state,
    "The Great Game begins."
  );

  // Player 1 then receives the
  // normal Turn 1 draw and
  // 1 Command.
  startTurnMutable(
    state,
    "player1"
  );

  return state;
}

// ─────────────────────────────────────────────
// Public action dispatcher
// ─────────────────────────────────────────────

export function applyAction(
  state: GameState,
  action: GameAction
): ActionResult {
  if (state.winner) {
    return {
      ok: false,
      state,
      error:
        "The game has already ended.",
    };
  }

  const draft =
    cloneState(state);

  try {
    switch (action.type) {
      case "play-card": {
        playCardMutable(
          draft,
          action
        );
        break;
      }

      case "military-attack": {
        militaryAttackMutable(
          draft,
          action
        );
        break;
      }

      case "political-attack": {
        politicalAttackMutable(
          draft,
          action
        );
        break;
      }

      case "end-turn": {
        endTurnMutable(
          draft
        );
        break;
      }

      default: {
        const exhaustive:
          never = action;

        throw new Error(
          `Unknown action: ${JSON.stringify(exhaustive)}`
        );
      }
    }

    return {
      ok: true,
      state: draft,
    };
  } catch (error) {
    return {
      ok: false,

      // Failed actions never mutate
      // the original state.
      state,

      error:
        error instanceof Error
          ? error.message
          : "Unknown game engine error.",
    };
  }
}