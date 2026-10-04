// lib/the-great-game/engine.ts
import { assignSupporters } from "./supporters";

import {
  getGameCard,
  hasTrait,
  isUnitCard,
} from "./cards";

import {
  createTestDeck,
  validateDeck,
} from "./deck";
import { recordChronicleAction } from "./chronicle-recorder";

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
  RuntimeModifier,
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
  playerId?: PlayerId,
  visibility: "public" | "owner" = "public"
) {
  state.log.push({
    id:
      state.log.length + 1,

    turn:
      state.turnNumber,

    playerId,

    visibility,
    turnOwnerId: state.activePlayerId,

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

  if (
    trait === "swift" &&
    unit.flags["driftmark-swift"] &&
    unit.deployedThisTurn
  ) {
    return true;
  }

  return false;
}

function adjacentAlliedUnits(
  state: GameState,
  unit: UnitState
): UnitState[] {
  const board =
    state.players[unit.ownerId].board;

  const index =
    board.findIndex(
      (candidate) =>
        candidate.instanceId ===
        unit.instanceId
    );

  if (index === -1) {
    return [];
  }

  return [
    board[index - 1],
    board[index + 1],
  ].filter(
    (candidate): candidate is UnitState =>
      Boolean(candidate)
  );
}

function countAdjacentAuraSources(
  state: GameState,
  unit: UnitState,
  sourceCardIds: readonly string[]
): number {
  const card =
    getGameCard(unit.cardId);

  if (card.cardType !== "character") {
    return 0;
  }

  return adjacentAlliedUnits(
    state,
    unit
  ).filter(
    (ally) =>
      sourceCardIds.includes(
        ally.cardId
      )
  ).length;
}

export function getMilitaryPower(
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

  let strength =
    card.strength;

  for (
    const modifier of
    unit.modifiers
  ) {
    strength +=
      modifier.strength ?? 0;
  }

  if (
    unit.attachedArtifactId ===
    "blackfyre"
  ) {
    strength += 2;
  }

  if (
    unit.attachedArtifactId ===
    "dark-sister"
  ) {
    strength += 2;
  }

  if (card.cardType === "character") {
    strength += countAdjacentAuraSources(
      state,
      unit,
      ["crownlands-champion"]
    );
  }

  return Math.max(
    0,
    strength
  );
}

export function getPoliticalPower(
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

  let politicalPower =
    card.influence;

  for (
    const modifier of
    unit.modifiers
  ) {
    politicalPower +=
      modifier.influence ??
      0;
  }

  if (
    unit.attachedArtifactId ===
    "blackfyre"
  ) {
    politicalPower += 1;
  }

  if (
    state.activeLocation
      ?.cardId ===
    "kings-landing"
  ) {
    politicalPower += 1;
  }

  politicalPower += countAdjacentAuraSources(
    state,
    unit,
    ["grand-counselor", "rickard-stark"]
  );

  return Math.max(
    0,
    politicalPower
  );
}

export function getBaseMaximumHealth(
  state: GameState,
  unit: UnitState
): number {
  const card = getGameCard(unit.cardId);

  if (!isUnitCard(card)) {
    return 0;
  }

  let health = card.health;

  // Positive Health modifiers live in the bonus layer. Negative modifiers
  // reduce the base layer so removing a bonus can never eat base Health.
  for (const modifier of unit.modifiers) {
    const amount = modifier.health ?? 0;
    if (amount < 0) {
      health += amount;
    }
  }

  return Math.max(1, health);
}

export function getBonusHealthCapacity(
  state: GameState,
  unit: UnitState
): number {
  const card = getGameCard(unit.cardId);

  if (!isUnitCard(card)) {
    return 0;
  }

  let bonus = 0;

  for (const modifier of unit.modifiers) {
    const amount = modifier.health ?? 0;
    if (amount > 0) {
      bonus += amount;
    }
  }

  if (card.cardType === "character") {
    bonus += countAdjacentAuraSources(
      state,
      unit,
      [
        "crownlands-champion",
        "grand-counselor",
        "saathos-maris",
      ]
    );

    if (
      state.activeLocation?.cardId === "castle-black" &&
      unitHasTrait(state, unit, "guard")
    ) {
      bonus += 1;
    }
  }

  return Math.max(0, bonus);
}

export function getMaximumHealth(
  state: GameState,
  unit: UnitState
): number {
  return Math.max(
    1,
    getBaseMaximumHealth(state, unit) +
      getBonusHealthCapacity(state, unit)
  );
}

type HealthLayerSnapshot = {
  baseMaximum: number;
  bonusCapacity: number;
};

function normalizedBonusHealth(
  state: GameState,
  unit: UnitState,
  bonusCapacity = getBonusHealthCapacity(state, unit),
  baseMaximum = getBaseMaximumHealth(state, unit)
): number {
  if (typeof unit.bonusHealth === "number") {
    return Math.max(0, Math.min(unit.bonusHealth, bonusCapacity, unit.currentHealth));
  }

  // Backwards-compatible migration for resumed games. Only Health above the
  // base maximum is certainly bonus Health; choosing the conservative value
  // ensures an old save never loses base Health merely because an aura ends.
  return Math.max(
    0,
    Math.min(
      bonusCapacity,
      unit.currentHealth,
      unit.currentHealth - Math.min(unit.currentHealth, baseMaximum)
    )
  );
}

function captureMaximumHealths(
  state: GameState
): Map<string, HealthLayerSnapshot> {
  const result = new Map<string, HealthLayerSnapshot>();

  for (const playerId of ["player1", "player2"] as PlayerId[]) {
    for (const unit of state.players[playerId].board) {
      const baseMaximum = getBaseMaximumHealth(state, unit);
      const bonusCapacity = getBonusHealthCapacity(state, unit);
      unit.bonusHealth = normalizedBonusHealth(
        state,
        unit,
        bonusCapacity,
        baseMaximum
      );
      result.set(unit.instanceId, { baseMaximum, bonusCapacity });
    }
  }

  return result;
}

function reconcileHealthAfterAuraChange(
  state: GameState,
  before: Map<string, HealthLayerSnapshot>
) {
  for (const playerId of ["player1", "player2"] as PlayerId[]) {
    for (const unit of state.players[playerId].board) {
      const baseMaximum = getBaseMaximumHealth(state, unit);
      const bonusCapacity = getBonusHealthCapacity(state, unit);
      const previous = before.get(unit.instanceId);

      if (!previous) {
        unit.bonusHealth = bonusCapacity;
        unit.currentHealth = baseMaximum + bonusCapacity;
        continue;
      }

      const previousBonus = normalizedBonusHealth(
        state,
        unit,
        previous.bonusCapacity,
        previous.baseMaximum
      );
      const previousBaseCurrent = Math.max(0, unit.currentHealth - previousBonus);

      let nextBonus = Math.min(previousBonus, bonusCapacity);
      if (bonusCapacity > previous.bonusCapacity) {
        nextBonus += bonusCapacity - previous.bonusCapacity;
      }
      nextBonus = Math.min(nextBonus, bonusCapacity);

      const nextBaseCurrent = Math.min(previousBaseCurrent, baseMaximum);

      unit.bonusHealth = nextBonus;
      unit.currentHealth = Math.max(0, nextBaseCurrent + nextBonus);
    }
  }
}

function consumeHealthDamageMutable(
  state: GameState,
  unit: UnitState,
  amount: number
) {
  const bonusCapacity = getBonusHealthCapacity(state, unit);
  const baseMaximum = getBaseMaximumHealth(state, unit);
  const bonusBefore = normalizedBonusHealth(
    state,
    unit,
    bonusCapacity,
    baseMaximum
  );
  const bonusDamage = Math.min(bonusBefore, amount);

  unit.bonusHealth = bonusBefore - bonusDamage;
  unit.currentHealth = Math.max(0, unit.currentHealth - amount);
}

function healUnitMutable(
  state: GameState,
  unit: UnitState,
  amount: number
): number {
  if (amount <= 0) return 0;

  const baseMaximum = getBaseMaximumHealth(state, unit);
  const bonusCapacity = getBonusHealthCapacity(state, unit);
  const bonusBefore = normalizedBonusHealth(
    state,
    unit,
    bonusCapacity,
    baseMaximum
  );
  const baseBefore = Math.max(0, unit.currentHealth - bonusBefore);

  const baseMissing = Math.max(0, baseMaximum - baseBefore);
  const baseHeal = Math.min(amount, baseMissing);
  const remaining = amount - baseHeal;
  const bonusMissing = Math.max(0, bonusCapacity - bonusBefore);
  const bonusHeal = Math.min(remaining, bonusMissing);

  unit.bonusHealth = bonusBefore + bonusHeal;
  unit.currentHealth = baseBefore + baseHeal + unit.bonusHealth;

  return baseHeal + bonusHeal;
}

function addCharacterModifierMutable(
  state: GameState,
  controllerId: PlayerId,
  target: UnitState,
  modifier: RuntimeModifier
): RuntimeModifier {
  const card = getGameCard(target.cardId);
  const adjusted: RuntimeModifier = { ...modifier };

  if (
    card.cardType === "character" &&
    state.activeLocation?.cardId === "oldtown" &&
    !state.players[controllerId].oldtownModifierUsedThisTurn
  ) {
    const positiveStats = (["strength", "influence", "health"] as const).filter(
      (key) => (adjusted[key] ?? 0) > 0
    );

    if (positiveStats.length > 0) {
      for (const key of positiveStats) {
        adjusted[key] = (adjusted[key] ?? 0) + 1;
      }

      state.players[controllerId].oldtownModifierUsedThisTurn = true;
      logAbilityActivation(state, "oldtown", "oldtown", controllerId);
    }
  }

  const healthBefore = captureMaximumHealths(state);
  target.modifiers.push(adjusted);
  reconcileHealthAfterAuraChange(state, healthBefore);

  return adjusted;
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

  if (card.cardType === "artifact" &&
    state.players[opponentOf(playerId)].board.some(
      (unit) => unit.attachedArtifactId === card.id
    )) {
    cost += 1;
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

function handSizeForLimit(
  player: PlayerState
): number {
  return player.hand.filter(
    (handCard) =>
      getGameCard(
        handCard.cardId
      ).special !==
      "royal-favor"
  ).length;
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
    handSizeForLimit(
      player
    ) >= HAND_LIMIT
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
      playerId,
      "owner"
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
  const healthBefore = captureMaximumHealths(state);

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

  if (state.activePlayerId !== unit.ownerId) {
    owner.characterDestroyedDuringOpponentTurn = true;
  }

  reconcileHealthAfterAuraChange(state, healthBefore);

  if (
    card.id ===
    "lorent-tyrell"
  ) {
    logAbilityActivation(
      state,
      card.id,
      "a-son-forewarned",
      unit.ownerId
    );

    drawCardMutable(
      state,
      unit.ownerId
    );

    if (
      playerControlsCard(
        state,
        unit.ownerId,
        "renrose-tyrell"
      )
    ) {
      gainStandingMutable(
        state,
        unit.ownerId,
        2,
        "A Son Forewarned"
      );
    }
  }
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
    card.id === "perric-bracken" &&
    kind === "event" &&
    !(unit.counters["perric-event-prevention-used"] ?? 0)
  ) {
    const prevented =
      Math.min(
        2,
        finalDamage
      );

    finalDamage -= prevented;
    unit.counters["perric-event-prevention-used"] = 1;

    if (prevented > 0) {
      logAbilityActivation(
        state,
        card.id,
        "an-unfortunate-accident",
        unit.ownerId,
        `Prevents ${prevented} Event damage.`
      );
    }
  }

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

  consumeHealthDamageMutable(
    state,
    unit,
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

function resolveImmediateArrivalAbilitiesMutable(
  state: GameState,
  unit: UnitState
) {
  const card = getGameCard(unit.cardId);

  if (card.id === "clover-tully") {
    logAbilityActivation(
      state,
      card.id,
      "a-drunken-mistake",
      unit.ownerId
    );

    gainStandingMutable(
      state,
      "player1",
      2,
      "A Drunken Mistake"
    );
    gainStandingMutable(
      state,
      "player2",
      2,
      "A Drunken Mistake"
    );
    drawCardMutable(
      state,
      unit.ownerId
    );
  }
}

function triggerLeoDeploymentMutable(
  state: GameState,
  deployed: UnitState
) {
  const deployedCard =
    getGameCard(deployed.cardId);

  if (deployedCard.cardType !== "character") {
    return;
  }

  const qualifies =
    deployedCard.id === "visenor-targaryen" ||
    (
      deployedCard.id !== "leo-tyrell" &&
      (deployedCard.houseId === "tyrell" ||
        deployedCard.houseId === "hightower")
    );

  if (!qualifies) {
    return;
  }

  const leos =
    state.players[deployed.ownerId].board.filter(
      (candidate) =>
        candidate.cardId === "leo-tyrell"
    );

  for (const leo of leos) {
    const before =
      getPoliticalPower(
        state,
        leo
      );

    addCharacterModifierMutable(
      state,
      deployed.ownerId,
      leo,
      {
        id: nextRuntimeId(state, "proud-of-his-name"),
        influence: 1,
        permanent: true,
      }
    );

    const after =
      getPoliticalPower(
        state,
        leo
      );

    logAbilityActivation(
      state,
      leo.cardId,
      "proud-of-his-name",
      leo.ownerId,
      `${deployedCard.name} is deployed; Leo gains +${after - before} Influence permanently.`
    );
  }
}

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
    const ironWrathTargets =
      allCharacters(
        state
      ).filter(
        (target) =>
          target.instanceId !==
          unit.instanceId
      );

    if (
      ironWrathTargets.length > 0
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

  const source = pending!.sourceUnitInstanceId
    ? findUnit(state, pending!.sourceUnitInstanceId)
    : undefined;

  if (pending!.abilityId !== "tyrosh") {
    assertRule(
      Boolean(source),
      "The source of the pending ability is no longer in play."
    );
  }

  const sourceCard = source
    ? getGameCard(source.cardId)
    : null;

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
        getPoliticalPower(
          state,
          target!
        );

      addCharacterModifierMutable(
        state,
        pending!.controllerId,
        target!,
        {
          id: nextRuntimeId(state, "manders-pact"),
          influence: 2,
          permanent: true,
        }
      );

      const after =
        getPoliticalPower(
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
        `ARRIVAL — ${sourceCard!.name}: The Mander's Pact grants ${getGameCard(target!.cardId).name} +${after - before} Influence. (${before} → ${after} Influence)`,
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
        `ARRIVAL — ${sourceCard!.name}: Veiled Sight marks ${getGameCard(target!.cardId).name}. It costs +2 Command until the start of ${playerName(pending!.controllerId)}'s next turn.`,
        pending!
          .controllerId
      );

      state.pendingEffect =
        null;

      return;
    }

    case "iron-wrath": {
      assertRule(
        Boolean(
          action.targetInstanceId
        ),
        "Iron Wrath requires another Unit."
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
        target!.instanceId !==
          source!.instanceId,
        "Iron Wrath must target another Unit."
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

    case "tyrosh": {
      const playerId = pending!.controllerId;
      const player = state.players[playerId];

      if (action.decline) {
        player.tyroshTradeUsedThisTurn = false;
        state.pendingEffect = null;
        addLog(state, "Tyroshi Trade is declined; the hand is kept.", playerId);
        finishEndTurnMutable(state);
        return;
      }

      assertRule(
        Boolean(action.targetHandInstanceId),
        "Tyroshi Trade requires a card to discard, or Keep All."
      );

      const handIndex = player.hand.findIndex(
        (handCard) => handCard.instanceId === action.targetHandInstanceId
      );

      assertRule(handIndex !== -1, "That card is no longer in your hand.");

      const [discarded] = player.hand.splice(handIndex, 1);
      player.discard.push(discarded.cardId);
      player.tyroshTradeUsedThisTurn = true;

      addLog(
        state,
        `Tyroshi Trade discards ${getGameCard(discarded.cardId).name}.`,
        playerId,
        "owner"
      );

      const drawn = drawCardMutable(state, playerId, {
        costModifier: {
          amount: -1,
          expiresAt: "while-in-hand",
          expiresForPlayerId: playerId,
        },
      });

      if (drawn.success && drawn.cardId) {
        addLog(
          state,
          `Tyroshi Trade reduces ${getGameCard(drawn.cardId).name}'s cost by 1 Command while it remains in hand.`,
          playerId,
          "owner"
        );
      }

      state.pendingEffect = null;
      finishEndTurnMutable(state);
      return;
    }
  }
}


export interface MilitaryCombatPreview {
  attackerDies: boolean;
  defenderDies: boolean;
  attackerGrounded: boolean;
  defenderGrounded: boolean;
  attackerDamageTaken: number;
  defenderDamageTaken: number;
}

function previewMilitaryDamage(
  unit: UnitState,
  card: GameCard,
  amount: number
): number {
  let finalDamage =
    Math.max(0, amount);

  if (
    card.id ===
      "alester-dayne"
  ) {
    const alreadyPrevented =
      unit.counters[
        "dawns-edge-prevented"
      ] ?? 0;

    finalDamage =
      Math.max(
        0,
        finalDamage -
          Math.max(
            0,
            2 -
              alreadyPrevented
          )
      );
  }

  return finalDamage;
}

export function getMilitaryCombatPreview(
  state: GameState,
  attackerInstanceId: string,
  defenderInstanceId: string
): MilitaryCombatPreview | null {
  const attacker =
    findUnit(
      state,
      attackerInstanceId
    );

  const defender =
    findUnit(
      state,
      defenderInstanceId
    );

  if (
    !attacker ||
    !defender
  ) {
    return null;
  }

  const attackerCard =
    getGameCard(
      attacker.cardId
    );

  const defenderCard =
    getGameCard(
      defender.cardId
    );

  if (
    !isUnitCard(attackerCard) ||
    !isUnitCard(defenderCard)
  ) {
    return null;
  }

  const defenderDamage =
    previewMilitaryDamage(
      defender,
      defenderCard,
      getMilitaryPower(
        state,
        attacker
      )
    );

  const attackerDamage =
    defender.grounded
      ? 0
      : previewMilitaryDamage(
          attacker,
          attackerCard,
          getMilitaryPower(
            state,
            defender
          )
        );

  const attackerLethal =
    attacker.currentHealth -
      attackerDamage <=
    0;

  const defenderLethal =
    defender.currentHealth -
      defenderDamage <=
    0;

  return {
    attackerDies:
      attackerCard.cardType ===
        "character" &&
      attackerLethal,
    defenderDies:
      defenderCard.cardType ===
        "character" &&
      defenderLethal,
    attackerGrounded:
      attackerCard.cardType ===
        "dragon" &&
      attackerLethal,
    defenderGrounded:
      defenderCard.cardType ===
        "dragon" &&
      defenderLethal,
    attackerDamageTaken:
      attackerDamage,
    defenderDamageTaken:
      defenderDamage,
  };
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
    ].board.filter(
      (unit) =>
        !unit.grounded
    );

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
      guards.length === 0 ||
      challenge,
  };
}

// ─────────────────────────────────────────────
// Political targeting
// ─────────────────────────────────────────────

export interface PoliticalDefenseOptions {
  unopposed: boolean;

  canAttackStanding: boolean;

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
      canAttackStanding: false,
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

      canAttackStanding: true,

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

      canAttackStanding: true,

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

      canAttackStanding: false,

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

    canAttackStanding: false,

    defenderInstanceIds:
      readyCharacters.map(
        (unit) =>
          unit.instanceId
      ),

    selectionBy:
      "attacker",
  };
}

// ─────────────────────────────────────────────
// Normal targeted card validation
// ─────────────────────────────────────────────

function assertEventMayTargetCharacter(
  playerId: PlayerId,
  target: UnitState
) {
  if (
    target.ownerId !== playerId &&
    target.cardId === "naela-targaryen" &&
    !target.exhausted
  ) {
    assertRule(
      false,
      "Whereabouts Unknown prevents enemy Events from targeting Naela Targaryen while she is Ready."
    );
  }
}

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

    /* Tactical targeting: Artifacts may be equipped to Characters on either side. */

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

    assertEventMayTargetCharacter(
      playerId,
      target!
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

    assertEventMayTargetCharacter(
      playerId,
      enemy!
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
      "The Brothers' Tilt requires a Character target."
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
      "The Brothers' Tilt must target a Character."
    );

    assertEventMayTargetCharacter(
      playerId,
      target!
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
      getPoliticalPower(
        state,
        target
      );

    addCharacterModifierMutable(
      state,
      playerId,
      target,
      {
        id: nextRuntimeId(state, "word-in-right-ear"),
        influence: 1,
        permanent: false,
        expiresAt: "end-of-current-turn",
      }
    );

    const after =
      getPoliticalPower(
        state,
        target
      );

    addLog(
      state,
      `${getGameCard(target.cardId).name} gains +${after - before} Influence. (${before} → ${after} Influence)`,
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
      getMilitaryPower(
        state,
        allied
      );

    const enemyPower =
      getMilitaryPower(
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
    ]
      .filter(
        (unit) =>
          getGameCard(unit.cardId).cardType ===
          "character"
      )
      .map(
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
      getMilitaryPower(
        state,
        target
      );

    // Snapshot the chosen Character's effective Strength before The Brothers'
    // Tilt applies its own modifier. Every other Character in play is compared
    // against this fixed value independently; the threshold never increases
    // as the Tilt grants Strength. Ready/Exhausted and controller do not matter.
    const weakerCharacters =
      allCharacters(state).filter(
        (candidate) =>
          candidate.instanceId !==
            target.instanceId &&
          getMilitaryPower(
            state,
            candidate
          ) < beforePower
      );

    const bonus =
      Math.min(
        3,
        weakerCharacters.length
      );

    if (
      bonus > 0
    ) {
      addCharacterModifierMutable(
        state,
        playerId,
        target,
        {
          id: nextRuntimeId(state, "brothers-tilt"),
          strength: bonus,
          permanent: true,
        }
      );
    }

    target.exhausted =
      true;

    const afterPower =
      getMilitaryPower(
        state,
        target
      );

    addLog(
      state,
      `${getGameCard(target.cardId).name} gains +${afterPower - beforePower} Strength and becomes Exhausted. (${beforePower} → ${afterPower} Strength)`,
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
        (card.cardType === "artifact" || !duplicateArtifact),
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
    const healthBefore = captureMaximumHealths(state);
    const characterDeploymentIndex = player.charactersDeployedThisTurn ?? 0;

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

      bonusHealth: 0,

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

    const requestedBoardIndex =
      (action as typeof action & { boardIndex?: number })
        .boardIndex;

    const boardIndex =
      typeof requestedBoardIndex === "number"
        ? Math.max(
            0,
            Math.min(
              player.board.length,
              Math.trunc(requestedBoardIndex)
            )
          )
        : player.board.length;

    player.board.splice(
      boardIndex,
      0,
      unit
    );

    if (card.cardType === "character") {
      if (
        state.activeLocation?.cardId === "driftmark" &&
        characterDeploymentIndex === 0
      ) {
        unit.flags["driftmark-swift"] = true;
        logAbilityActivation(state, "driftmark", "driftmark", playerId);
      }

      player.charactersDeployedThisTurn = characterDeploymentIndex + 1;
    }

    reconcileHealthAfterAuraChange(state, healthBefore);

    addLog(
      state,
      `${card.name} enters play.`,
      playerId
    );

    if (
      card.cardType ===
      "character"
    ) {
      resolveImmediateArrivalAbilitiesMutable(
        state,
        unit
      );

      triggerLeoDeploymentMutable(
        state,
        unit
      );

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

    for (const owner of ["player1", "player2"] as const) {
      for (const equipped of state.players[owner].board) {
        if (equipped.attachedArtifactId === card.id) {
          equipped.attachedArtifactId = null;
        }
      }
    }

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
    const healthBefore = captureMaximumHealths(state);

    if (
      state.activeLocation
    ) {
      const old =
        state.activeLocation;

      if (old.cardId === "highgarden") {
        resetHighgardenProgressMutable(state);
      }

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

    reconcileHealthAfterAuraChange(state, healthBefore);

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
// Conflict-scoped Location / passive helpers
// ─────────────────────────────────────────────

function beginConflictMutable(
  state: GameState,
  playerId: PlayerId,
  attacker: UnitState,
  kind: "military" | "political"
): { strengthBonus: number; influenceBonus: number } {
  const player = state.players[playerId];
  const attackerCard = getGameCard(attacker.cardId);
  const firstConflict = (player.conflictsInitiatedThisTurn ?? 0) === 0;
  const firstStarfallCharacter =
    attackerCard.cardType === "character" &&
    !(player.starfallCharacterConflictUsedThisTurn ?? false);

  let strengthBonus = 0;
  let influenceBonus = 0;

  if (
    attackerCard.cardType === "character" &&
    firstConflict &&
    state.activeLocation?.cardId === "winterfell" &&
    player.characterDestroyedDuringOpponentPreviousTurn
  ) {
    strengthBonus += 1;
    influenceBonus += 1;
    logAbilityActivation(
      state,
      "winterfell",
      "winterfell",
      playerId,
      `${attackerCard.name} remembers the fallen and gains +1 Strength and +1 Influence for this Conflict.`
    );
  }

  if (
    kind === "military" &&
    attackerCard.cardType === "character" &&
    firstStarfallCharacter &&
    state.activeLocation?.cardId === "starfall"
  ) {
    strengthBonus += 1;
    logAbilityActivation(
      state,
      "starfall",
      "starfall",
      playerId,
      `${attackerCard.name} gains +1 Strength for this Conflict.`
    );
  }

  player.conflictsInitiatedThisTurn = (player.conflictsInitiatedThisTurn ?? 0) + 1;
  if (kind === "military") {
    player.militaryConflictsInitiatedThisTurn =
      (player.militaryConflictsInitiatedThisTurn ?? 0) + 1;

    if (attackerCard.cardType === "character") {
      player.starfallCharacterConflictUsedThisTurn = true;
    }
  }

  return { strengthBonus, influenceBonus };
}

function militaryDefensePower(
  state: GameState,
  defender: UnitState
): number {
  let power = getMilitaryPower(state, defender);
  if (
    state.activeLocation?.cardId === "riverrun" &&
    getGameCard(defender.cardId).cardType === "character"
  ) {
    power += 1;
  }
  return power;
}

function politicalDefensePower(
  state: GameState,
  defender: UnitState
): number {
  let power = getPoliticalPower(state, defender);
  if (
    state.activeLocation?.cardId === "riverrun" &&
    getGameCard(defender.cardId).cardType === "character"
  ) {
    power += 1;
  }
  return power;
}

function orwellStrengthBonus(
  unit: UnitState,
  opposingUnit: UnitState
): number {
  return unit.cardId === "orwell-morrigen" &&
    getGameCard(opposingUnit.cardId).cardType === "character" &&
    opposingUnit.deployedThisTurn
    ? 2
    : 0;
}

function registerMilitaryWinMutable(
  state: GameState,
  playerId: PlayerId
) {
  const player = state.players[playerId];
  const winsBefore = player.militaryWinsThisTurn ?? 0;
  player.militaryWinsThisTurn = winsBefore + 1;

  if (
    winsBefore === 0 &&
    state.activeLocation?.cardId === "storms-end"
  ) {
    logAbilityActivation(state, "storms-end", "storms-end", playerId);
    gainStandingMutable(state, playerId, 1, "The Stag's Hunt");
  }
}

function maybeApplySunspearPoisonMutable(
  state: GameState,
  playerId: PlayerId,
  target: UnitState,
  damageDealt: number
) {
  const player = state.players[playerId];
  if (
    state.activeLocation?.cardId !== "sunspear" ||
    player.sunspearPoisonAppliedThisTurn ||
    damageDealt < 3 ||
    getGameCard(target.cardId).cardType !== "character" ||
    !findUnit(state, target.instanceId)
  ) {
    return;
  }

  player.sunspearPoisonAppliedThisTurn = true;

  const alreadyPoisoned = state.delayedEffects.some(
    (effect) =>
      effect.type === "sunspear-poison" &&
      effect.targetUnitInstanceId === target.instanceId
  );

  if (!alreadyPoisoned) {
    state.delayedEffects.push({
      id: nextRuntimeId(state, "poison"),
      type: "sunspear-poison",
      triggerPlayerId: playerId,
      targetUnitInstanceId: target.instanceId,
      remainingTriggers: 2,
    });
  }

  logAbilityActivation(
    state,
    "sunspear",
    "sunspear",
    playerId,
    alreadyPoisoned
      ? `${getGameCard(target.cardId).name} is already poisoned.`
      : `${getGameCard(target.cardId).name} is poisoned for the next 2 ${playerName(playerId)} turns.`
  );
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

  const conflictBonus = beginConflictMutable(
    state,
    playerId,
    attacker!,
    "military"
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

    const guardsInPlay =
      state.players[enemyId].board.filter(
        (unit) =>
          !unit.grounded &&
          unitHasTrait(
            state,
            unit,
            "guard"
          )
      );

    if (
      guardsInPlay.length > 0 &&
      unitHasTrait(
        state,
        attacker!,
        "challenge"
      )
    ) {
      logTraitActivation(
        state,
        "challenge",
        attacker!.cardId,
        "bypasses Guard and attacks Standing directly.",
        playerId
      );
    }

    attacker!.exhausted =
      true;

    const damage =
      getMilitaryPower(
        state,
        attacker!
      ) + conflictBonus.strengthBonus;

    damageStandingMutable(
      state,
      enemyId,
      damage,
      {
        source:
          `${attackerCard.name} — Military Attack`,
      }
    );

    if (damage > 0) {
      registerMilitaryWinMutable(state, playerId);
    }

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

  const attackerOrwellBonus = orwellStrengthBonus(attacker!, target!);
  const defenderOrwellBonus = orwellStrengthBonus(target!, attacker!);

  if (attackerOrwellBonus > 0) {
    logAbilityActivation(state, attacker!.cardId, "experience-triumphs", playerId);
  }
  if (defenderOrwellBonus > 0) {
    logAbilityActivation(state, target!.cardId, "experience-triumphs", target!.ownerId);
  }

  const attackerPower =
    getMilitaryPower(
      state,
      attacker!
    ) + conflictBonus.strengthBonus + attackerOrwellBonus;

  const targetPower =
    militaryDefensePower(
      state,
      target!
    ) + defenderOrwellBonus;

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

  maybeApplySunspearPoisonMutable(
    state,
    playerId,
    target!,
    targetResult.damageDealt
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

  const survivingAttacker = findUnit(state, attacker!.instanceId);
  if (
    (targetResult.destroyed || targetResult.grounded) &&
    survivingAttacker &&
    !survivingAttacker.grounded
  ) {
    registerMilitaryWinMutable(state, playerId);
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

  const conflictBonus = beginConflictMutable(
    state,
    playerId,
    attacker!,
    "political"
  );

  let attackerPoliticalPower =
    getPoliticalPower(
      state,
      attacker!
    ) + conflictBonus.influenceBonus;

  assertRule(
    attackerPoliticalPower > 0,
    "A Character with 0 Influence cannot initiate a Political Conflict."
  );

  const readyRhaella =
    state.players[enemyId].board.find(
      (unit) =>
        unit.cardId === "rhaella-targaryen" &&
        !unit.exhausted &&
        !(unit.counters["dangerous-name-used"] ?? 0)
    );

  if (readyRhaella) {
    const before = attackerPoliticalPower;
    attackerPoliticalPower = Math.max(0, attackerPoliticalPower - 2);
    readyRhaella.counters["dangerous-name-used"] = 1;

    logAbilityActivation(
      state,
      readyRhaella.cardId,
      "dangerous-name",
      readyRhaella.ownerId,
      `The first enemy Political Conflict loses ${before - attackerPoliticalPower} Influence. (${before} → ${attackerPoliticalPower})`
    );
  }

  attacker!.exhausted =
    true;

  if (
    !action.defenderInstanceId &&
    defense.canAttackStanding
  ) {
    if (
      !defense.unopposed &&
      unitHasTrait(
        state,
        attacker!,
        "confront"
      )
    ) {
      logTraitActivation(
        state,
        "confront",
        attacker!.cardId,
        "bypasses Political defenders and attacks Standing directly.",
        playerId
      );
    }

    if (
      attackerPoliticalPower > 0
    ) {
      damageStandingMutable(
        state,
        enemyId,
        attackerPoliticalPower,
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

  const defenderPoliticalPower =
    politicalDefensePower(
      state,
      defender!
    );

  if (
    attackerPoliticalPower >=
    defenderPoliticalPower
  ) {
    defender!.exhausted =
      true;
  }

  const difference =
    attackerPoliticalPower -
    defenderPoliticalPower;

  addLog(
    state,
    `${attackerCard.name} challenges ${getGameCard(defender!.cardId).name} politically. (${attackerPoliticalPower} vs ${defenderPoliticalPower} Influence)`,
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
      attackerPoliticalPower <
        defenderPoliticalPower
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
      effect.type !== "manders-pact-draw" ||
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

function processSunspearDelayedEffects(
  state: GameState,
  playerId: PlayerId
) {
  const remaining: DelayedEffect[] = [];

  for (const effect of state.delayedEffects) {
    if (
      effect.type !== "sunspear-poison" ||
      effect.triggerPlayerId !== playerId
    ) {
      remaining.push(effect);
      continue;
    }

    const target = findUnit(state, effect.targetUnitInstanceId);
    if (!target) {
      continue;
    }

    logAbilityActivation(
      state,
      "sunspear",
      "sunspear",
      playerId,
      `${getGameCard(target.cardId).name} takes 1 poison damage after the normal draw.`
    );

    damageUnitMutable(
      state,
      target.instanceId,
      1,
      "ability",
      "The Viper's Kiss"
    );

    const triggersLeft = Math.max(0, (effect.remainingTriggers ?? 1) - 1);
    if (triggersLeft > 0 && findUnit(state, target.instanceId)) {
      remaining.push({ ...effect, remainingTriggers: triggersLeft });
    }
  }

  state.delayedEffects = remaining;
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
          playerId,
          "owner"
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
        state,
        unit
      );

    const before =
      unit.currentHealth;

    healUnitMutable(
      state,
      unit,
      1
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
      unit.counters["perric-event-prevention-used"] = 0;
      unit.counters["dangerous-name-used"] = 0;
    }
  }
}

// ─────────────────────────────────────────────
// Weylar
// ─────────────────────────────────────────────

function processWeylarEndOfTurnProgress(
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
  }
}

function processWeylarStartOfTurn(
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
      weylar.counters[
        "turns-in-play"
      ] ?? 0;

    if (turns < 3) {
      continue;
    }

    drawCardMutable(
      state,
      playerId
    );

    drawCardMutable(
      state,
      playerId
    );

    // startTurnMutable consumes nextCommandBonus later in this same
    // start-of-turn sequence, so this becomes +2 Command this turn.
    state.players[
      playerId
    ].nextCommandBonus +=
      2;

    weylar.flags[
      "weylar-triggered"
    ] = true;

    addLog(
      state,
      `The Price of Loyalty resolves. ${playerName(playerId)} draws 2 cards and gains +2 Command this turn.`,
      playerId
    );
  }
}

// ─────────────────────────────────────────────
// Highgarden
// ─────────────────────────────────────────────

function resetHighgardenProgressMutable(
  state: GameState
) {
  for (const playerId of ["player1", "player2"] as PlayerId[]) {
    for (const unit of state.players[playerId].board) {
      delete unit.counters["highgarden-retained-turns"];
    }
  }
}

function processHighgardenEndOfTurn(
  state: GameState,
  playerId: PlayerId
) {
  if (state.activeLocation?.cardId !== "highgarden") {
    return;
  }

  for (const unit of state.players[playerId].board) {
    if (getGameCard(unit.cardId).cardType !== "character") {
      continue;
    }

    const turns = (unit.counters["highgarden-retained-turns"] ?? 0) + 1;
    unit.counters["highgarden-retained-turns"] = turns;

    if (![2, 4, 6].includes(turns)) {
      continue;
    }

    const gains = unit.counters["highgarden-influence-gains"] ?? 0;
    if (gains >= 3) {
      continue;
    }

    const before = getPoliticalPower(state, unit);
    addCharacterModifierMutable(
      state,
      playerId,
      unit,
      {
        id: nextRuntimeId(state, "highgarden"),
        influence: 1,
        permanent: true,
      }
    );
    unit.counters["highgarden-influence-gains"] = gains + 1;

    const after = getPoliticalPower(state, unit);

    logAbilityActivation(
      state,
      "highgarden",
      "highgarden",
      playerId,
      `${getGameCard(unit.cardId).name} gains +${after - before} Influence permanently. (${before} → ${after} Influence; ${turns}/6 retained turns)`
    );
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

  player.eventsPlayedThisTurn = 0;
  player.conflictsInitiatedThisTurn = 0;
  player.militaryConflictsInitiatedThisTurn = 0;
  player.starfallCharacterConflictUsedThisTurn = false;
  player.militaryWinsThisTurn = 0;
  player.charactersDeployedThisTurn = 0;
  player.oldtownModifierUsedThisTurn = false;
  player.sunspearPoisonAppliedThisTurn = false;
  player.tyroshTradeUsedThisTurn = false;
  player.characterDestroyedDuringOpponentPreviousTurn =
    player.characterDestroyedDuringOpponentTurn ?? false;
  player.characterDestroyedDuringOpponentTurn = false;

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

  processManderDelayedEffects(
    state,
    playerId
  );

  processWeylarStartOfTurn(
    state,
    playerId
  );

  processCordinStartOfTurn(
    state,
    playerId
  );

  drawCardMutable(
    state,
    playerId
  );

  processSunspearDelayedEffects(state, playerId);

  player.maxCommand =
    Math.min(
      MAX_COMMAND,
      player.maxCommand + 1
    );

  const bonus = player.nextCommandBonus;
  const commandBeforeRefill = player.command;
  const uncappedBonus = player.nextCommandBonusUncapped ?? 0;

  player.command =
    Math.min(
      MAX_COMMAND,
      player.maxCommand + bonus
    ) + uncappedBonus;

  player.nextCommandBonus = 0;
  player.nextCommandBonusUncapped = 0;

  if (bonus > 0 || uncappedBonus > 0) {
    addLog(
      state,
      `Command refills to ${player.command}. (${commandBeforeRefill} → ${player.command} Command; ${player.maxCommand} base${bonus > 0 ? ` + ${bonus} bonus` : ""}${uncappedBonus > 0 ? ` + ${uncappedBonus} Iron Bank` : ""})`,
      playerId
    );
  } else {
    addLog(
      state,
      `Command refills to ${player.command}. (${commandBeforeRefill} → ${player.command} Command)`,
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

function finishEndTurnMutable(
  state: GameState
) {
  const playerId = state.activePlayerId;
  const player = state.players[playerId];

  addLog(
    state,
    `${playerName(playerId)} ends Turn ${player.turnsTaken}.`,
    playerId
  );

  processWeylarEndOfTurnProgress(state, playerId);
  processHighgardenEndOfTurn(state, playerId);

  if (
    state.activeLocation?.cardId === "braavos" &&
    player.command >= 1
  ) {
    player.nextCommandBonusUncapped =
      (player.nextCommandBonusUncapped ?? 0) + 1;
    logAbilityActivation(
      state,
      "braavos",
      "braavos",
      playerId,
      "At least 1 Command was left unspent; +1 Command is banked for the next turn."
    );
  }

  player.tyroshTradeUsedPreviousOwnTurn =
    player.tyroshTradeUsedThisTurn ?? false;

  expireHandModifiersAtEnd(state, playerId);
  expireUnitModifiersAtEnd(state, playerId);

  for (const unit of player.board) {
    unit.deployedThisTurn = false;
    unit.flags["driftmark-swift"] = false;
  }

  readyAllUnitsMutable(state);

  // Unspent Command does not carry into another player's turn. Braavos stores
  // only its explicit +1 bonus via nextCommandBonusUncapped.
  player.command = 0;

  const nextPlayer = opponentOf(playerId);
  state.turnNumber += 1;
  startTurnMutable(state, nextPlayer);
}

function endTurnMutable(
  state: GameState
) {
  const playerId = state.activePlayerId;
  const player = state.players[playerId];

  assertRule(
    !state.pendingEffect,
    "Resolve the pending ability before ending the turn."
  );

  const tyroshEligible =
    state.activeLocation?.cardId === "tyrosh" &&
    !(player.tyroshTradeUsedPreviousOwnTurn ?? false) &&
    player.hand.length > 0;

  if (tyroshEligible) {
    state.pendingEffect = {
      id: nextRuntimeId(state, "pending"),
      controllerId: playerId,
      sourceUnitInstanceId: null,
      abilityId: "tyrosh",
    };

    logAbilityActivation(
      state,
      "tyrosh",
      "tyrosh",
      playerId,
      "Choose a card to trade, or keep the current hand."
    );
    return;
  }

  finishEndTurnMutable(state);
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
    nextCommandBonusUncapped: 0,

    conflictsInitiatedThisTurn: 0,
    militaryConflictsInitiatedThisTurn: 0,
    starfallCharacterConflictUsedThisTurn: false,
    militaryWinsThisTurn: 0,
    charactersDeployedThisTurn: 0,
    oldtownModifierUsedThisTurn: false,
    sunspearPoisonAppliedThisTurn: false,
    characterDestroyedDuringOpponentTurn: false,
    characterDestroyedDuringOpponentPreviousTurn: false,
    tyroshTradeUsedPreviousOwnTurn: false,
    tyroshTradeUsedThisTurn: false,

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
    supporters: assignSupporters(),
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

  // Second-player compensation: one additional normal opening card.
  // Royal Favor is still granted separately after Player 2 finishes mulligan.
  drawCardMutable(
    state,
    "player2",
    { silent: true }
  );

  return state;
}

// ─────────────────────────────────────────────
// Public dispatcher
// ─────────────────────────────────────────────

function applyActionResult(
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

export function applyAction(state: GameState, action: GameAction): ActionResult {
  const result = applyActionResult(state, action);
  if (result.ok) recordChronicleAction(state, result.state, action);
  return result;
}
