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
  AbilityId,
  AbilityTrigger,
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

export const MAX_MULLIGAN_REPLACEMENTS = 3;

export const BOARD_LIMIT = 6;
export const DRAGON_BOARD_LIMIT = 2;

export const MAX_COMMAND = 10;

// ─────────────────────────────────────────────
// General helpers
// ─────────────────────────────────────────────

export function opponentOf(
  playerId: PlayerId
): PlayerId {
  return playerId === "player1"
    ? "player2"
    : "player1";
}

function playerName(
  playerId: PlayerId
): string {
  return playerId === "player1"
    ? "Player 1"
    : "Player 2";
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
    id:
      state.log.length + 1,

    turn:
      state.turnNumber,

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
        Math.random() *
          (i + 1)
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
// Ability log helpers
// ─────────────────────────────────────────────

function triggerLabel(
  trigger: AbilityTrigger
): string {
  switch (trigger) {
    case "arrival":
      return "ARRIVAL";

    case "fall":
      return "FALL";

    case "victory":
      return "VICTORY";

    case "start-of-turn":
      return "START OF TURN";

    case "end-of-turn":
      return "END OF TURN";

    case "passive":
      return "PASSIVE";

    case "event":
      return "EFFECT";

    case "bond":
      return "BOND";
  }
}

function logAbilityActivation(
  state: GameState,
  cardId: string,
  abilityId: AbilityId,
  playerId?: PlayerId,
  suffix?: string
) {
  const card =
    getGameCard(cardId);

  const ability =
    card.abilities.find(
      (candidate) =>
        candidate.id ===
        abilityId
    );

  if (!ability) {
    return;
  }

  addLog(
    state,
    `${triggerLabel(
      ability.trigger
    )} — ${card.name}: ${ability.name} activates.${
      suffix
        ? ` ${suffix}`
        : ""
    }`,
    playerId
  );
}

function logTraitActivation(
  state: GameState,
  trait: Trait,
  cardId: string,
  message: string,
  playerId?: PlayerId
) {
  addLog(
    state,
    `${trait.toUpperCase()} — ${getGameCard(cardId).name}: ${message}`,
    playerId
  );
}

// ─────────────────────────────────────────────
// Lookup
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
      unit.cardId ===
      cardId
  );
}

// ─────────────────────────────────────────────
// Traits / effective stats
// ─────────────────────────────────────────────

export function unitHasTrait(
  state: GameState,
  unit: UnitState,
  trait: Trait
): boolean {
  const card =
    getGameCard(
      unit.cardId
    );

  if (
    hasTrait(
      card,
      trait
    )
  ) {
    return true;
  }

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
    getGameCard(
      unit.cardId
    );

  if (!isUnitCard(card)) {
    return 0;
  }

  let power =
    card.power;

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

  return Math.max(
    0,
    power
  );
}

export function getEffectiveInfluence(
  state: GameState,
  unit: UnitState
): number {
  const card =
    getGameCard(
      unit.cardId
    );

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
      modifier.influence ??
      0;
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
    getGameCard(
      unit.cardId
    );

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
  const card =
    getGameCard(
      handCard.cardId
    );

  let cost =
    card.cost;

  for (
    const modifier of
    handCard.costModifiers
  ) {
    cost +=
      modifier.amount;
  }

  if (
    card.cardType ===
      "dragon" &&
    state.activeLocation
      ?.cardId ===
      "dragonstone"
  ) {
    cost -= 1;
  }

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

  if (
    card.cardType ===
      "event" &&
    !card.special &&
    state.activeLocation
      ?.cardId ===
      "oldtown" &&
    state.players[playerId]
      .eventsPlayedThisTurn ===
      0
  ) {
    cost -= 1;
  }

  return Math.max(
    0,
    cost
  );
}

// ─────────────────────────────────────────────
// Hand / Draw
// ─────────────────────────────────────────────

function addCardToHandMutable(
  state: GameState,
  playerId: PlayerId,
  cardId: string
): HandCardState {
  const card: HandCardState = {
    instanceId:
      nextRuntimeId(
        state,
        "hand"
      ),

    cardId,

    costModifiers: [],
  };

  state.players[
    playerId
  ].hand.push(card);

  return card;
}

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
        `${playerName(
          playerId
        )} cannot draw: the deck is empty.`,
        playerId
      );
    }

    return {
      success: false,
      burned: false,
    };
  }

  if (
    player.hand.length >=
    HAND_LIMIT
  ) {
    player.discard.push(
      cardId
    );

    player.burnedCards.push(
      cardId
    );

    if (!options?.silent) {
      addLog(
        state,
        `${getGameCard(cardId).name} is burned. (${player.deck.length} cards remain in deck)`,
        playerId
      );
    }

    return {
      success: false,
      burned: true,
      cardId,
    };
  }

  const handCard =
    addCardToHandMutable(
      state,
      playerId,
      cardId
    );

  if (
    options?.costModifier
  ) {
    handCard.costModifiers.push({
      id:
        nextRuntimeId(
          state,
          "cost-mod"
        ),

      ...options.costModifier,
    });
  }

  if (!options?.silent) {
    addLog(
      state,
      `Drew ${getGameCard(cardId).name}. (${player.deck.length} cards remain in deck)`,
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
// Mulligan
// ─────────────────────────────────────────────

function resolveMulliganMutable(
  state: GameState,
  action: Extract<
    GameAction,
    {
      type: "mulligan";
    }
  >
) {
  const playerId =
    state.activePlayerId;

  const expectedPlayer =
    state.phase ===
      "mulligan-player1"
      ? "player1"
      : state.phase ===
          "mulligan-player2"
        ? "player2"
        : null;

  assertRule(
    expectedPlayer !== null,
    "The opening mulligan has already ended."
  );

  assertRule(
    playerId ===
      expectedPlayer,
    "It is not this player's mulligan."
  );

  const player =
    state.players[playerId];

  const uniqueIds =
    Array.from(
      new Set(
        action.replaceHandInstanceIds
      )
    );

  assertRule(
    uniqueIds.length <=
      MAX_MULLIGAN_REPLACEMENTS,
    `You may replace at most ${MAX_MULLIGAN_REPLACEMENTS} cards.`
  );

  const replacedCards:
    HandCardState[] = [];

  for (
    const instanceId of
    uniqueIds
  ) {
    const card =
      player.hand.find(
        (candidate) =>
          candidate.instanceId ===
          instanceId
      );

    assertRule(
      Boolean(card),
      "A selected mulligan card is no longer in the opening hand."
    );

    replacedCards.push(
      card!
    );
  }

  player.hand =
    player.hand.filter(
      (card) =>
        !uniqueIds.includes(
          card.instanceId
        )
    );

  for (
    let index = 0;
    index <
    replacedCards.length;
    index++
  ) {
    const replacementId =
      player.deck.shift();

    assertRule(
      Boolean(
        replacementId
      ),
      "Not enough cards remain to complete the mulligan."
    );

    addCardToHandMutable(
      state,
      playerId,
      replacementId!
    );
  }

  player.deck.push(
    ...replacedCards.map(
      (card) =>
        card.cardId
    )
  );

  player.deck =
    shuffle(
      player.deck
    );

  state.mulligan.completed[
    playerId
  ] = true;

  addLog(
    state,
    `${playerName(
      playerId
    )} replaced ${replacedCards.length} opening ${
      replacedCards.length ===
      1
        ? "card"
        : "cards"
    }.`,
    playerId
  );

  if (
    playerId === "player1"
  ) {
    state.phase =
      "mulligan-player2";

    state.activePlayerId =
      "player2";

    return;
  }

  addCardToHandMutable(
    state,
    "player2",
    "royal-favor"
  );

  addLog(
    state,
    "Player 2 receives Royal Favor.",
    "player2"
  );

  state.phase =
    "playing";

  state.activePlayerId =
    "player1";

  state.turnNumber = 1;

  addLog(
    state,
    "The Great Game begins."
  );

  startTurnMutable(
    state,
    "player1"
  );
}

// ─────────────────────────────────────────────
// Standing
// ─────────────────────────────────────────────

function evaluateWinnerMutable(
  state: GameState
) {
  const p1Dead =
    state.players.player1
      .standing <= 0;

  const p2Dead =
    state.players.player2
      .standing <= 0;

  if (
    p1Dead &&
    p2Dead
  ) {
    state.winner =
      "draw";

    state.phase =
      "finished";

    return;
  }

  if (p1Dead) {
    state.winner =
      "player2";

    state.phase =
      "finished";

    return;
  }

  if (p2Dead) {
    state.winner =
      "player1";

    state.phase =
      "finished";

    return;
  }

  state.winner = null;
}

function damageStandingMutable(
  state: GameState,
  playerId: PlayerId,
  amount: number,
  options?: {
    source?: string;
    evaluate?: boolean;
  }
) {
  if (amount <= 0) {
    return;
  }

  const player =
    state.players[playerId];

  const before =
    player.standing;

  player.standing =
    Math.max(
      0,
      before - amount
    );

  const actualDamage =
    before -
    player.standing;

  const prefix =
    options?.source
      ? `${options.source}: `
      : "";

  addLog(
    state,
    `${prefix}${playerName(
      playerId
    )} loses ${actualDamage} Standing. (${before} → ${player.standing} Standing)`,
    playerId
  );

  if (
    options?.evaluate !==
    false
  ) {
    evaluateWinnerMutable(
      state
    );
  }
}

function gainStandingMutable(
  state: GameState,
  playerId: PlayerId,
  amount: number,
  source?: string
) {
  if (amount <= 0) {
    return;
  }

  const player =
    state.players[playerId];

  const before =
    player.standing;

  player.standing =
    before + amount;

  const actualGain =
    player.standing -
    before;

  const prefix =
    source
      ? `${source}: `
      : "";

  addLog(
    state,
    `${prefix}${playerName(
      playerId
    )} gains ${actualGain} Standing. (${before} → ${player.standing} Standing)`,
    playerId
  );
}

// ─────────────────────────────────────────────
// Damage
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
    getGameCard(
      unit.cardId
    );

  assertRule(
    card.cardType ===
      "character",
    "Only Characters may be destroyed through this path."
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
    `${card.name} is destroyed.`,
    unit.ownerId
  );
}

function damageUnitMutable(
  state: GameState,
  instanceId: string,
  amount: number,
  kind: DamageKind,
  source?: string
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
    getGameCard(
      unit.cardId
    );

  assertRule(
    isUnitCard(card),
    "Damage target must be a Character or Dragon."
  );

  let finalDamage =
    amount;

  if (
    card.id ===
      "alester-dayne" &&
    kind === "military"
  ) {
    const alreadyPrevented =
      unit.counters[
        "dawns-edge-prevented"
      ] ?? 0;

    const remaining =
      Math.max(
        0,
        2 -
          alreadyPrevented
      );

    const prevented =
      Math.min(
        remaining,
        finalDamage
      );

    finalDamage -=
      prevented;

    unit.counters[
      "dawns-edge-prevented"
    ] =
      alreadyPrevented +
      prevented;

    if (
      prevented > 0
    ) {
      logAbilityActivation(
        state,
        card.id,
        "dawns-edge",
        unit.ownerId,
        `Prevents ${prevented} Military damage.`
      );
    }
  }

  if (
    finalDamage <= 0
  ) {
    return {
      damageDealt: 0,
      destroyed: false,
      grounded: false,
    };
  }

  const before =
    unit.currentHealth;

  unit.currentHealth =
    Math.max(
      0,
      before -
        finalDamage
    );

  const prefix =
    source
      ? `${source}: `
      : "";

  const damageLabel =
    kind === "military"
      ? "Military damage"
      : "damage";

  addLog(
    state,
    `${prefix}${card.name} takes ${finalDamage} ${damageLabel}. (${before} → ${unit.currentHealth} Health)`
  );

  if (
    card.cardType ===
      "dragon" &&
    unit.currentHealth <= 0
  ) {
    const newlyGrounded =
      !unit.grounded;

    unit.currentHealth = 0;

    unit.grounded = true;

    if (
      newlyGrounded
    ) {
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
// Character helpers
// ─────────────────────────────────────────────

function enemyCharacters(
  state: GameState,
  playerId: PlayerId
): UnitState[] {
  return state.players[
    opponentOf(playerId)
  ].board.filter(
    (unit) =>
      getGameCard(
        unit.cardId
      ).cardType ===
      "character"
  );
}

function allCharacters(
  state: GameState
): UnitState[] {
  return [
    ...state.players.player1.board,
    ...state.players.player2.board,
  ].filter(
    (unit) =>
      getGameCard(
        unit.cardId
      ).cardType ===
      "character"
  );
}

// ─────────────────────────────────────────────
// Arrival queue
// ─────────────────────────────────────────────

function queueArrivalEffectMutable(
  state: GameState,
  unit: UnitState
) {
  const card =
    getGameCard(
      unit.cardId
    );

  if (
    card.id ===
    "renrose-tyrell"
  ) {
    const targets =
      allCharacters(
        state
      ).filter(
        (target) =>
          target.instanceId !==
          unit.instanceId
      );

    if (
      targets.length > 0
    ) {
      state.pendingEffect = {
        id:
          nextRuntimeId(
            state,
            "pending"
          ),

        controllerId:
          unit.ownerId,

        sourceUnitInstanceId:
          unit.instanceId,

        abilityId:
          "manders-pact",
      };

      logAbilityActivation(
        state,
        card.id,
        "manders-pact",
        unit.ownerId
      );
    }

    return;
  }

  if (
    card.id ===
    "saera-targaryen"
  ) {
    const enemyId =
      opponentOf(
        unit.ownerId
      );

    if (
      state.players[
        enemyId
      ].hand.length > 0
    ) {
      state.pendingEffect = {
        id:
          nextRuntimeId(
            state,
            "pending"
          ),

        controllerId:
          unit.ownerId,

        sourceUnitInstanceId:
          unit.instanceId,

        abilityId:
          "veiled-sight",
      };

      logAbilityActivation(
        state,
        card.id,
        "veiled-sight",
        unit.ownerId
      );
    }

    return;
  }

  if (
    card.id ===
    "baelenys-targaryen"
  ) {
    if (
      enemyCharacters(
        state,
        unit.ownerId
      ).length > 0
    ) {
      state.pendingEffect = {
        id:
          nextRuntimeId(
            state,
            "pending"
          ),

        controllerId:
          unit.ownerId,

        sourceUnitInstanceId:
          unit.instanceId,

        abilityId:
          "iron-wrath",
      };

      logAbilityActivation(
        state,
        card.id,
        "iron-wrath",
        unit.ownerId
      );
    }
  }
}

// ─────────────────────────────────────────────
// Resolve mandatory Arrival effect
// ─────────────────────────────────────────────

function resolvePendingEffectMutable(
  state: GameState,
  action: Extract<
    GameAction,
    {
      type:
        "resolve-pending-effect";
    }
  >
) {
  const pending =
    state.pendingEffect;

  assertRule(
    Boolean(pending),
    "There is no pending ability to resolve."
  );

  assertRule(
    pending!.controllerId ===
      state.activePlayerId,
    "Only the active player may resolve this ability."
  );

  const source =
    findUnit(
      state,
      pending!
        .sourceUnitInstanceId
    );

  assertRule(
    Boolean(source),
    "The source of the pending ability is no longer in play."
  );

  const sourceCard =
    getGameCard(
      source!.cardId
    );

  switch (
    pending!.abilityId
  ) {
    case "manders-pact": {
      assertRule(
        Boolean(
          action.targetInstanceId
        ),
        "The Mander's Pact requires a Character target."
      );

      const target =
        findUnit(
          state,
          action.targetInstanceId!
        );

      assertRule(
        Boolean(target),
        "The Mander's Pact target no longer exists."
      );

      assertRule(
        target!.instanceId !==
          source!.instanceId,
        "Renrose must choose another Character."
      );

      assertRule(
        getGameCard(
          target!.cardId
        ).cardType ===
          "character",
        "The Mander's Pact must target a Character."
      );

      const before =
        getEffectiveInfluence(
          state,
          target!
        );

      target!.modifiers.push({
        id:
          nextRuntimeId(
            state,
            "manders-pact"
          ),

        influence: 2,

        permanent: true,
      });

      const after =
        getEffectiveInfluence(
          state,
          target!
        );

      state.delayedEffects.push({
        id:
          nextRuntimeId(
            state,
            "delayed"
          ),

        type:
          "manders-pact-draw",

        triggerPlayerId:
          pending!
            .controllerId,

        targetUnitInstanceId:
          target!.instanceId,
      });

      addLog(
        state,
        `ARRIVAL — ${sourceCard.name}: The Mander's Pact grants ${getGameCard(target!.cardId).name} +2 Influence. (${before} → ${after} Influence)`,
        pending!
          .controllerId
      );

      state.pendingEffect =
        null;

      return;
    }

    case "veiled-sight": {
      const enemyId =
        opponentOf(
          pending!
            .controllerId
        );

      assertRule(
        Boolean(
          action.targetHandInstanceId
        ),
        "Veiled Sight requires a card from the opponent's hand."
      );

      const target =
        state.players[
          enemyId
        ].hand.find(
          (handCard) =>
            handCard.instanceId ===
            action.targetHandInstanceId
        );

      assertRule(
        Boolean(target),
        "The chosen card is no longer in the opponent's hand."
      );

      target!.costModifiers.push({
        id:
          nextRuntimeId(
            state,
            "cost-mod"
          ),

        amount: 2,

        expiresAt:
          "start-of-player-turn",

        expiresForPlayerId:
          pending!
            .controllerId,
      });

      addLog(
        state,
        `ARRIVAL — ${sourceCard.name}: Veiled Sight marks ${getGameCard(target!.cardId).name}. It costs +2 Command until the start of ${playerName(pending!.controllerId)}'s next turn.`,
        pending!
          .controllerId
      );

      state.pendingEffect =
        null;

      return;
    }

    case "iron-wrath": {
      const enemyId =
        opponentOf(
          pending!
            .controllerId
        );

      assertRule(
        Boolean(
          action.targetInstanceId
        ),
        "Iron Wrath requires an enemy Character."
      );

      const target =
        findUnit(
          state,
          action.targetInstanceId!
        );

      assertRule(
        Boolean(target),
        "Iron Wrath target no longer exists."
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

      const result =
        damageUnitMutable(
          state,
          target!.instanceId,
          3,
          "ability",
          "Iron Wrath"
        );

      if (
        result.destroyed
      ) {
        gainStandingMutable(
          state,
          pending!
            .controllerId,
          3,
          "Iron Wrath"
        );
      }

      state.pendingEffect =
        null;

      evaluateWinnerMutable(
        state
      );

      return;
    }
  }
}

// ─────────────────────────────────────────────
// Military targeting
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
        if (
          unit.grounded
        ) {
          return false;
        }

        return unitHasTrait(
          state,
          unit,
          "guard"
        );
      }
    );

  const challenge =
    unitHasTrait(
      state,
      attacker,
      "challenge"
    );

  if (
    guards.length > 0 &&
    !challenge
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

    canAttackStanding:
      guards.length === 0,
  };
}

// ─────────────────────────────────────────────
// Political targeting
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

  const enemyId =
    opponentOf(
      attacker.ownerId
    );

  const readyCharacters =
    state.players[
      enemyId
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

  if (
    readyCharacters.length ===
    0
  ) {
    return {
      unopposed: true,

      defenderInstanceIds:
        [],

      selectionBy:
        "none",
    };
  }

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

  const intrigue =
    readyCharacters.filter(
      (unit) =>
        unitHasTrait(
          state,
          unit,
          "intrigue"
        )
    );

  if (
    intrigue.length > 0
  ) {
    return {
      unopposed: false,

      defenderInstanceIds:
        intrigue.map(
          (unit) =>
            unit.instanceId
        ),

      selectionBy:
        "attacker",
    };
  }

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
// Normal targeted card validation
// ─────────────────────────────────────────────

function validatePlayTargets(
  state: GameState,
  playerId: PlayerId,
  card: GameCard,
  action: Extract<
    GameAction,
    {
      type: "play-card";
    }
  >
) {
  const enemyId =
    opponentOf(
      playerId
    );

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
      "Artifacts may only be equipped to Characters you control."
    );

    assertRule(
      getGameCard(
        target!.cardId
      ).cardType ===
        "character",
      "Artifacts may only be equipped to Characters."
    );

    assertRule(
      !target!
        .attachedArtifactId,
      "That Character already has an Artifact."
    );
  }

  if (
    card.id ===
    "word-in-the-right-ear"
  ) {
    assertRule(
      Boolean(
        action.targetInstanceId
      ),
      "A Word in the Right Ear requires a Character target."
    );

    const target =
      findUnit(
        state,
        action.targetInstanceId!
      );

    assertRule(
      Boolean(target) &&
        getGameCard(
          target!.cardId
        ).cardType ===
          "character",
      "A Word in the Right Ear must target a Character."
    );
  }

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
      Boolean(allied) &&
        allied!.ownerId ===
          playerId &&
        getGameCard(
          allied!.cardId
        ).cardType ===
          "character",
      "Trial by Combat's first target must be a Character you control."
    );

    assertRule(
      Boolean(enemy) &&
        enemy!.ownerId ===
          enemyId &&
        getGameCard(
          enemy!.cardId
        ).cardType ===
          "character",
      "Trial by Combat's second target must be an enemy Character."
    );
  }

  if (
    card.id ===
    "brothers-tilt"
  ) {
    assertRule(
      Boolean(
        action.targetInstanceId
      ),
      "The Brothers' Tilt requires a Character you control."
    );

    const target =
      findUnit(
        state,
        action.targetInstanceId!
      );

    assertRule(
      Boolean(target) &&
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
// Events
// ─────────────────────────────────────────────

function resolveEventMutable(
  state: GameState,
  playerId: PlayerId,
  card: GameCard,
  action: Extract<
    GameAction,
    {
      type: "play-card";
    }
  >
) {
  if (
    card.id ===
    "word-in-the-right-ear"
  ) {
    logAbilityActivation(
      state,
      card.id,
      "word-in-the-right-ear",
      playerId
    );

    const target =
      findUnit(
        state,
        action.targetInstanceId!
      )!;

    const before =
      getEffectiveInfluence(
        state,
        target
      );

    target.modifiers.push({
      id:
        nextRuntimeId(
          state,
          "word-in-right-ear"
        ),

      influence: 1,

      permanent: false,

      expiresAt:
        "end-of-current-turn",
    });

    const after =
      getEffectiveInfluence(
        state,
        target
      );

    addLog(
      state,
      `${getGameCard(target.cardId).name} gains +1 Influence. (${before} → ${after} Influence)`,
      playerId
    );

    return;
  }

  if (
    card.id ===
    "trial-by-combat"
  ) {
    logAbilityActivation(
      state,
      card.id,
      "trial-by-combat",
      playerId
    );

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
      "military",
      "Trial by Combat"
    );

    damageUnitMutable(
      state,
      enemy.instanceId,
      alliedPower,
      "military",
      "Trial by Combat"
    );

    return;
  }

  if (
    card.id ===
    "oldtown-massacre"
  ) {
    logAbilityActivation(
      state,
      card.id,
      "oldtown-massacre",
      playerId
    );

    const unitIds = [
      ...state.players.player1.board,
      ...state.players.player2.board,
    ].map(
      (unit) =>
        unit.instanceId
    );

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
          "event",
          "Oldtown Massacre"
        );
      }
    }

    damageStandingMutable(
      state,
      "player1",
      2,
      {
        source:
          "Oldtown Massacre",

        evaluate: false,
      }
    );

    damageStandingMutable(
      state,
      "player2",
      2,
      {
        source:
          "Oldtown Massacre",

        evaluate: false,
      }
    );

    evaluateWinnerMutable(
      state
    );

    return;
  }

  if (
    card.id ===
    "brothers-tilt"
  ) {
    logAbilityActivation(
      state,
      card.id,
      "brothers-tilt",
      playerId
    );

    const target =
      findUnit(
        state,
        action.targetInstanceId!
      )!;

    const beforePower =
      getEffectivePower(
        state,
        target
      );

    const enemyId =
      opponentOf(
        playerId
      );

    const weakerReady =
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
              "character" ||
            enemy.exhausted
          ) {
            return false;
          }

          return (
            beforePower >
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
        weakerReady.length
      );

    if (
      bonus > 0
    ) {
      target.modifiers.push({
        id:
          nextRuntimeId(
            state,
            "brothers-tilt"
          ),

        power: bonus,

        permanent: true,
      });
    }

    target.exhausted =
      true;

    const afterPower =
      getEffectivePower(
        state,
        target
      );

    addLog(
      state,
      `${getGameCard(target.cardId).name} gains +${bonus} Power and becomes Exhausted. (${beforePower} → ${afterPower} Power)`,
      playerId
    );
  }
}

// ─────────────────────────────────────────────
// Play card
// ─────────────────────────────────────────────

function playCardMutable(
  state: GameState,
  action: Extract<
    GameAction,
    {
      type: "play-card";
    }
  >
) {
  const playerId =
    state.activePlayerId;

  const player =
    state.players[playerId];

  const handIndex =
    player.hand.findIndex(
      (card) =>
        card.instanceId ===
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

  if (
    !isUnitCard(card)
  ) {
    validatePlayTargets(
      state,
      playerId,
      card,
      action
    );
  }

  const cost =
    getEffectiveCost(
      state,
      playerId,
      handCard
    );

  assertRule(
    player.command >=
      cost,
    `Not enough Command. ${card.name} costs ${cost}.`
  );

  const dragonstoneDiscount =
    card.cardType ===
      "dragon" &&
    state.activeLocation
      ?.cardId ===
      "dragonstone";

  const bondActive =
    (
      card.id ===
        "jhagar" &&
      playerControlsCard(
        state,
        playerId,
        "jacaelon-targaryen"
      )
    ) ||
    (
      card.id ===
        "cloudgazer" &&
      playerControlsCard(
        state,
        playerId,
        "saera-targaryen"
      )
    ) ||
    (
      card.id ===
        "maelwing" &&
      playerControlsCard(
        state,
        playerId,
        "baelenys-targaryen"
      )
    );

  const oldtownDiscount =
    card.cardType ===
      "event" &&
    !card.special &&
    state.activeLocation
      ?.cardId ===
      "oldtown" &&
    player.eventsPlayedThisTurn ===
      0;

  player.command -=
    cost;

  player.hand.splice(
    handIndex,
    1
  );

  addLog(
    state,
    `Played ${card.name} for ${cost} Command.`,
    playerId
  );

  if (
    dragonstoneDiscount
  ) {
    addLog(
      state,
      `PASSIVE — Dragonstone reduces ${card.name}'s cost by 1 Command.`,
      playerId
    );
  }

  if (bondActive) {
    const ability =
      card.abilities.find(
        (candidate) =>
          candidate.trigger ===
          "bond"
      );

    if (ability) {
      logAbilityActivation(
        state,
        card.id,
        ability.id,
        playerId,
        "Its cost is reduced by 2 Command."
      );
    }
  }

  if (
    oldtownDiscount
  ) {
    addLog(
      state,
      `PASSIVE — Oldtown reduces ${card.name}'s cost by 1 Command.`,
      playerId
    );
  }

  if (
    card.special ===
    "royal-favor"
  ) {
    const before =
      player.command;

    player.command =
      Math.min(
        MAX_COMMAND,
        player.command + 1
      );

    player.removedFromGame.push(
      card.id
    );

    logAbilityActivation(
      state,
      card.id,
      "royal-favor",
      playerId,
      `Command increases from ${before} → ${player.command}.`
    );

    return;
  }

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

    player.board.push(
      unit
    );

    addLog(
      state,
      `${card.name} enters play.`,
      playerId
    );

    if (
      card.cardType ===
      "character"
    ) {
      queueArrivalEffectMutable(
        state,
        unit
      );
    }

    return;
  }

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
      `${card.name} is equipped to ${getGameCard(target!.cardId).name}.`,
      playerId
    );

    const ability =
      card.abilities[0];

    if (ability) {
      logAbilityActivation(
        state,
        card.id,
        ability.id,
        playerId,
        `It is now active on ${getGameCard(target!.cardId).name}.`
      );
    }

    return;
  }

  if (
    card.cardType ===
    "location"
  ) {
    if (
      state.activeLocation
    ) {
      const old =
        state.activeLocation;

      state.players[
        old.playedBy
      ].discard.push(
        old.cardId
      );

      addLog(
        state,
        `${getGameCard(old.cardId).name} is replaced.`
      );
    }

    state.activeLocation = {
      cardId:
        card.id,

      playedBy:
        playerId,
    };

    addLog(
      state,
      `${card.name} becomes the active Location.`,
      playerId
    );

    const ability =
      card.abilities[0];

    if (ability) {
      logAbilityActivation(
        state,
        card.id,
        ability.id,
        playerId
      );
    }
  }
}

// ─────────────────────────────────────────────
// Military
// ─────────────────────────────────────────────

function militaryAttackMutable(
  state: GameState,
  action: Extract<
    GameAction,
    {
      type:
        "military-attack";
    }
  >
) {
  const playerId =
    state.activePlayerId;

  const enemyId =
    opponentOf(
      playerId
    );

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

    logTraitActivation(
      state,
      "swift",
      attacker!.cardId,
      "ignores the deployment restriction and initiates a Military Conflict.",
      playerId
    );
  }

  const options =
    getMilitaryTargetOptions(
      state,
      attacker!.instanceId
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

  const attackerCard =
    getGameCard(
      attacker!.cardId
    );

  if (
    action.targetPlayerId
  ) {
    assertRule(
      action.targetPlayerId ===
        enemyId,
      "You may only attack enemy Standing."
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
      damage,
      {
        source:
          `${attackerCard.name} — Military Attack`,
      }
    );

    return;
  }

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
    "You may only attack enemy units."
  );

  assertRule(
    options.unitInstanceIds.includes(
      target!.instanceId
    ),
    "That target cannot currently be attacked."
  );

  const enemyGuards =
    state.players[
      enemyId
    ].board.filter(
      (unit) =>
        !unit.grounded &&
        unitHasTrait(
          state,
          unit,
          "guard"
        )
    );

  const challenge =
    unitHasTrait(
      state,
      attacker!,
      "challenge"
    );

  if (
    enemyGuards.length > 0 &&
    !challenge
  ) {
    logTraitActivation(
      state,
      "guard",
      target!.cardId,
      "must be faced before other Military targets.",
      target!.ownerId
    );
  }

  if (
    enemyGuards.length > 0 &&
    challenge &&
    !unitHasTrait(
      state,
      target!,
      "guard"
    )
  ) {
    logTraitActivation(
      state,
      "challenge",
      attacker!.cardId,
      `ignores Guard and challenges ${getGameCard(target!.cardId).name}.`,
      playerId
    );
  }

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

  const targetResult =
    damageUnitMutable(
      state,
      target!.instanceId,
      attackerPower,
      "military",
      `${attackerCard.name} — Military Conflict`
    );

  if (
    !targetWasGrounded
  ) {
    damageUnitMutable(
      state,
      attacker!.instanceId,
      targetPower,
      "military",
      `${targetCard.name} — Military Defense`
    );
  }

  if (
    attacker!.cardId ===
      "gaelor-targaryen" &&
    targetCard.cardType ===
      "character" &&
    targetResult.destroyed
  ) {
    logAbilityActivation(
      state,
      attacker!.cardId,
      "housebreaker",
      playerId
    );

    damageStandingMutable(
      state,
      enemyId,
      2,
      {
        source:
          "Housebreaker",
      }
    );
  }

  evaluateWinnerMutable(
    state
  );
}

// ─────────────────────────────────────────────
// Political
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

  logAbilityActivation(
    state,
    attacker.cardId,
    "silent-verdict",
    attacker.ownerId
  );

  damageStandingMutable(
    state,
    enemyId,
    2,
    {
      source:
        "Silent Verdict",
    }
  );
}

function politicalAttackMutable(
  state: GameState,
  action: Extract<
    GameAction,
    {
      type:
        "political-attack";
    }
  >
) {
  const playerId =
    state.activePlayerId;

  const enemyId =
    opponentOf(
      playerId
    );

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
    "Only Characters may initiate Political Conflicts."
  );

  assertRule(
    !attacker!.exhausted,
    "That Character is Exhausted."
  );

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

    logTraitActivation(
      state,
      "schemer",
      attacker!.cardId,
      "ignores the deployment restriction and initiates a Political Conflict.",
      playerId
    );
  }

  const defense =
    getPoliticalDefenseOptions(
      state,
      attacker!.instanceId
    );

  const attackerInfluence =
    getEffectiveInfluence(
      state,
      attacker!
    );

  assertRule(
    attackerInfluence > 0,
    "A Character with 0 Influence cannot initiate a Political Conflict."
  );

  attacker!.exhausted =
    true;

  if (
    defense.unopposed
  ) {
    if (
      attackerInfluence > 0
    ) {
      damageStandingMutable(
        state,
        enemyId,
        attackerInfluence,
        {
          source:
            `${attackerCard.name} — Unopposed Political Conflict`,
        }
      );

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

  if (
    !defenderInstanceId &&
    defense.defenderInstanceIds
      .length === 1
  ) {
    defenderInstanceId =
      defense.defenderInstanceIds[0];
  }

  assertRule(
    Boolean(
      defenderInstanceId
    ),
    "A Political defender must be chosen."
  );

  assertRule(
    defense.defenderInstanceIds.includes(
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

  const readyIntrigue =
    state.players[
      enemyId
    ].board.filter(
      (unit) =>
        getGameCard(
          unit.cardId
        ).cardType ===
          "character" &&
        !unit.exhausted &&
        unitHasTrait(
          state,
          unit,
          "intrigue"
        )
    );

  if (
    readyIntrigue.length > 0 &&
    unitHasTrait(
      state,
      attacker!,
      "confront"
    ) &&
    !unitHasTrait(
      state,
      defender!,
      "intrigue"
    )
  ) {
    logTraitActivation(
      state,
      "confront",
      attacker!.cardId,
      `ignores Intrigue and chooses ${getGameCard(defender!.cardId).name}.`,
      playerId
    );
  } else if (
    readyIntrigue.length > 0 &&
    !unitHasTrait(
      state,
      attacker!,
      "confront"
    )
  ) {
    logTraitActivation(
      state,
      "intrigue",
      defender!.cardId,
      "must oppose the Political Conflict.",
      defender!.ownerId
    );
  }

  const defenderInfluence =
    getEffectiveInfluence(
      state,
      defender!
    );

  if (
    attackerInfluence >=
    defenderInfluence
  ) {
    defender!.exhausted =
      true;
  }

  const difference =
    attackerInfluence -
    defenderInfluence;

  addLog(
    state,
    `${attackerCard.name} challenges ${getGameCard(defender!.cardId).name} politically. (${attackerInfluence} vs ${defenderInfluence} Influence)`,
    playerId
  );

  if (
    difference > 0
  ) {
    damageStandingMutable(
      state,
      enemyId,
      difference,
      {
        source:
          `${attackerCard.name} — Political Victory`,
      }
    );

    resolveSilentVerdictMutable(
      state,
      attacker!
    );
  } else {
    addLog(
      state,
      attackerInfluence <
        defenderInfluence
        ? `${getGameCard(defender!.cardId).name} dismisses the weaker Political challenge and remains Ready.`
        : `${getGameCard(defender!.cardId).name} prevents all Political Standing damage.`,
      defender!.ownerId
    );
  }

  evaluateWinnerMutable(
    state
  );
}

// ─────────────────────────────────────────────
// Expiration
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
        handCard.costModifiers.filter(
          (modifier) =>
            !(
              modifier.expiresAt ===
                "start-of-player-turn" &&
              modifier.expiresForPlayerId ===
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
        handCard.costModifiers.filter(
          (modifier) =>
            !(
              modifier.expiresAt ===
                "end-of-player-turn" &&
              modifier.expiresForPlayerId ===
                playerId
            )
        );
    }
  }
}

function expireUnitModifiersAtStart(
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
      const unit of
      state.players[
        ownerId
      ].board
    ) {
      unit.modifiers =
        unit.modifiers.filter(
          (modifier) =>
            !(
              !modifier.permanent &&
              modifier.expiresAt ===
                "start-of-controller-next-turn" &&
              unit.ownerId ===
                playerId
            )
        );
    }
  }
}

function expireUnitModifiersAtEnd(
  state: GameState,
  endingPlayerId: PlayerId
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
      unit.modifiers =
        unit.modifiers.filter(
          (modifier) => {
            if (
              modifier.permanent
            ) {
              return true;
            }

            if (
              modifier.expiresAt ===
              "end-of-current-turn"
            ) {
              return false;
            }

            if (
              modifier.expiresAt ===
                "end-of-controller-turn" &&
              unit.ownerId ===
                endingPlayerId
            ) {
              return false;
            }

            return true;
          }
        );
    }
  }
}

// ─────────────────────────────────────────────
// Mander delayed draw
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
      remaining.push(
        effect
      );

      continue;
    }

    const target =
      findUnit(
        state,
        effect.targetUnitInstanceId
      );

    if (target) {
      addLog(
        state,
        `START OF TURN — The Mander's Pact endures through ${getGameCard(target.cardId).name}. ${playerName(playerId)} draws 1 card.`,
        playerId
      );

      drawCardMutable(
        state,
        playerId
      );
    } else {
      addLog(
        state,
        "START OF TURN — The Mander's Pact target is no longer in play. No card is drawn.",
        playerId
      );
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
    const previousSuccessful =
      cordin.flags[
        "cordin-previous-draw-successful"
      ] ?? false;

    logAbilityActivation(
      state,
      cordin.cardId,
      "as-i-was-saying",
      playerId
    );

    const result =
      drawCardMutable(
        state,
        playerId
      );

    if (
      previousSuccessful &&
      result.success &&
      result.handInstanceId
    ) {
      const drawn =
        getHandCard(
          state.players[
            playerId
          ],
          result.handInstanceId
        );

      drawn?.costModifiers.push({
        id:
          nextRuntimeId(
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
          `As I Was Saying reduces ${getGameCard(result.cardId).name}'s cost by 1 Command this turn.`,
          playerId
        );
      }
    }

    cordin.flags[
      "cordin-previous-draw-successful"
    ] =
      result.success;
  }
}

// ─────────────────────────────────────────────
// Grounded Dragons
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

    const before =
      unit.currentHealth;

    unit.currentHealth =
      Math.min(
        maximum,
        before + 1
      );

    const threshold =
      Math.ceil(
        maximum / 2
      );

    addLog(
      state,
      `${card.name} recovers 1 Health while Grounded. (${before} → ${unit.currentHealth} Health; threshold ${threshold})`,
      playerId
    );

    if (
      unit.currentHealth >=
      threshold
    ) {
      unit.grounded =
        false;

      addLog(
        state,
        `${card.name} is no longer Grounded.`,
        playerId
      );
    }
  }
}

// ─────────────────────────────────────────────
// Turn counters
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
    ] =
      turns;

    logAbilityActivation(
      state,
      weylar.cardId,
      "price-of-loyalty",
      playerId,
      `Progress: ${Math.min(turns, 3)}/3.`
    );

    if (
      turns === 3
    ) {
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
        `The Price of Loyalty resolves. ${playerName(playerId)} draws 2 cards and gains +2 Command next turn.`,
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

  player.turnsTaken += 1;

  player.eventsPlayedThisTurn =
    0;

  resetPerTurnCounters(
    state
  );

  expireHandModifiersAtStart(
    state,
    playerId
  );

  expireUnitModifiersAtStart(
    state,
    playerId
  );

  addLog(
    state,
    `${playerName(playerId)} begins Turn ${player.turnsTaken}.`,
    playerId
  );

  recoverGroundedDragons(
    state,
    playerId
  );

  /*
   * Start-of-turn draw order:
   * 1) Natural turn draw always happens first.
   * 2) Card / delayed start-of-turn draw effects resolve afterwards.
   *
   * This matters for effects such as Cordin Poole's "As I Was Saying":
   * only the card drawn by Cordin's own ability can receive its
   * conditional -1 Command modifier. The normal turn draw must never
   * accidentally receive that discount.
   */
  drawCardMutable(
    state,
    playerId
  );

  processManderDelayedEffects(
    state,
    playerId
  );

  processCordinStartOfTurn(
    state,
    playerId
  );

  player.maxCommand =
    Math.min(
      MAX_COMMAND,
      player.maxCommand + 1
    );

  const bonus =
    player.nextCommandBonus;

  player.command =
    Math.min(
      MAX_COMMAND,
      player.maxCommand +
        bonus
    );

  player.nextCommandBonus =
    0;

  if (
    bonus > 0
  ) {
    addLog(
      state,
      `Command refills to ${player.command}. (${player.maxCommand} base + ${bonus} bonus)`,
      playerId
    );
  } else {
    addLog(
      state,
      `Command refills to ${player.command}.`,
      playerId
    );
  }
}

// ─────────────────────────────────────────────
// End Turn
// ─────────────────────────────────────────────

function readyAllUnitsMutable(
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
      unit.exhausted =
        false;
    }
  }
}

function endTurnMutable(
  state: GameState
) {
  const playerId =
    state.activePlayerId;

  assertRule(
    !state.pendingEffect,
    "Resolve the pending ability before ending the turn."
  );

  processWeylarEndOfTurn(
    state,
    playerId
  );

  expireHandModifiersAtEnd(
    state,
    playerId
  );

  expireUnitModifiersAtEnd(
    state,
    playerId
  );

  for (
    const unit of
    state.players[
      playerId
    ].board
  ) {
    unit.deployedThisTurn =
      false;
  }

  readyAllUnitsMutable(
    state
  );

  // Unspent Command does not carry into
  // another player's turn.
  state.players[
    playerId
  ].command = 0;

  const nextPlayer =
    opponentOf(
      playerId
    );

  state.turnNumber += 1;

  startTurnMutable(
    state,
    nextPlayer
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

    turnsTaken: 0,

    maxCommand: 0,

    command: 0,

    nextCommandBonus: 0,

    deck:
      shuffle(deck),

    hand: [],

    discard: [],

    board: [],

    burnedCards: [],

    removedFromGame: [],

    eventsPlayedThisTurn:
      0,
  };
}

export function createGame(
  player1Deck: string[] =
    createTestDeck(),

  player2Deck: string[] =
    createTestDeck()
): GameState {
  const p1Validation =
    validateDeck(
      player1Deck
    );

  const p2Validation =
    validateDeck(
      player2Deck
    );

  if (
    !p1Validation.valid
  ) {
    throw new Error(
      `Player 1 deck invalid:\n${p1Validation.errors.join("\n")}`
    );
  }

  if (
    !p2Validation.valid
  ) {
    throw new Error(
      `Player 2 deck invalid:\n${p2Validation.errors.join("\n")}`
    );
  }

  const state: GameState = {
    turnNumber: 0,

    activePlayerId:
      "player1",

    phase:
      "mulligan-player1",

    mulligan: {
      completed: {
        player1: false,
        player2: false,
      },
    },

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

    pendingEffect: null,

    winner: null,

    log: [],

    nextInstanceNumber: 1,
  };

  for (
    let index = 0;
    index <
    STARTING_HAND_SIZE;
    index++
  ) {
    drawCardMutable(
      state,
      "player1",
      {
        silent: true,
      }
    );

    drawCardMutable(
      state,
      "player2",
      {
        silent: true,
      }
    );
  }

  return state;
}

// ─────────────────────────────────────────────
// Public dispatcher
// ─────────────────────────────────────────────

export function applyAction(
  state: GameState,
  action: GameAction
): ActionResult {
  if (
    state.phase ===
      "finished" ||
    state.winner
  ) {
    return {
      ok: false,

      state,

      error:
        "The game has already ended.",
    };
  }

  const draft =
    cloneState(
      state
    );

  try {
    if (
      action.type ===
      "mulligan"
    ) {
      resolveMulliganMutable(
        draft,
        action
      );

      return {
        ok: true,

        state: draft,
      };
    }

    assertRule(
      draft.phase ===
        "playing",
      "The opening mulligan must be completed before gameplay begins."
    );

    if (
      draft.pendingEffect
    ) {
      assertRule(
        action.type ===
          "resolve-pending-effect",
        "Resolve the pending ability before taking another action."
      );

      resolvePendingEffectMutable(
        draft,
        action
      );

      return {
        ok: true,

        state: draft,
      };
    }

    switch (
      action.type
    ) {
      case "resolve-pending-effect":
        throw new Error(
          "There is no pending ability to resolve."
        );

      case "play-card":
        playCardMutable(
          draft,
          action
        );
        break;

      case "military-attack":
        militaryAttackMutable(
          draft,
          action
        );
        break;

      case "political-attack":
        politicalAttackMutable(
          draft,
          action
        );
        break;

      case "end-turn":
        endTurnMutable(
          draft
        );
        break;

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

      state,

      error:
        error instanceof Error
          ? error.message
          : "Unknown game engine error.",
    };
  }
}
