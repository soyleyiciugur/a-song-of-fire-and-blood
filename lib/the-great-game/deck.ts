// lib/the-great-game/deck.ts

import {
  findGameCard,
  getAllGameCards,
  isDeckable,
  isUnique,
  isUnitCard,
} from "./cards";

// ─────────────────────────────────────────────
// Validation result
// ─────────────────────────────────────────────

export interface DeckValidationResult {
  valid: boolean;
  errors: string[];
}

// ─────────────────────────────────────────────
// Deck validation
// ─────────────────────────────────────────────

export function validateDeck(
  cardIds: string[]
): DeckValidationResult {
  const errors: string[] = [];

  // Exactly 30 cards
  if (cardIds.length !== 30) {
    errors.push(
      `Deck must contain exactly 30 cards. Current: ${cardIds.length}.`
    );
  }

  const counts =
    new Map<string, number>();

  // Validate IDs / deckability
  for (const cardId of cardIds) {
    const card =
      findGameCard(cardId);

    if (!card) {
      errors.push(
        `Unknown card: ${cardId}`
      );

      continue;
    }

    if (!isDeckable(card)) {
      errors.push(
        `${card.name} cannot be added to a deck.`
      );
    }

    counts.set(
      cardId,
      (counts.get(cardId) ?? 0) + 1
    );
  }

  // Copy limits
  for (const [
    cardId,
    count,
  ] of counts.entries()) {
    const card =
      findGameCard(cardId);

    if (!card) {
      continue;
    }

    const maxCopies =
      isUnique(card)
        ? 1
        : 2;

    if (count > maxCopies) {
      errors.push(
        `${card.name} allows maximum ${maxCopies} ${
          maxCopies === 1
            ? "copy"
            : "copies"
        }.`
      );
    }
  }

  const validCards = cardIds
    .map((cardId) =>
      findGameCard(cardId)
    )
    .filter(
      (
        card
      ): card is NonNullable<
        typeof card
      > => Boolean(card)
    );

  // Minimum 15 Characters / Dragons
  const unitCount =
    validCards.filter(
      isUnitCard
    ).length;

  if (unitCount < 15) {
    errors.push(
      `Deck must contain at least 15 Characters/Dragons. Current: ${unitCount}.`
    );
  }

  // Locations
  const locations =
    validCards.filter(
      (card) =>
        card.cardType ===
        "location"
    );

  const distinctLocations =
    new Set(
      locations.map(
        (card) => card.id
      )
    );

  if (
    distinctLocations.size > 2
  ) {
    errors.push(
      "Deck may contain at most 2 different Locations."
    );
  }

  // Each Location max 1 copy
  for (const locationId of distinctLocations) {
    const count =
      counts.get(locationId) ??
      0;

    if (count > 1) {
      const location =
        findGameCard(
          locationId
        );

      errors.push(
        `${location?.name ?? locationId} may only appear once in a deck.`
      );
    }
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}

// ─────────────────────────────────────────────
// Temporary local-play test deck
// ─────────────────────────────────────────────

export function createTestDeck(): string[] {
  const deck: string[] = [
    // ── Named Characters — 8 ──

    "jacaelon-targaryen",
    "gaelor-targaryen",
    "alester-dayne",
    "renrose-tyrell",
    "cordin-poole",
    "saera-targaryen",
    "baelenys-targaryen",
    "weylar-rocke",

    // ── Dragons — 3 ──

    "jhagar",
    "cloudgazer",
    "maelwing",

    // ── 1 Command Characters — 4 ──

    "castle-swordsman",
    "castle-swordsman",

    "court-page",
    "court-page",

    // ── Other Generic Characters — 7 ──

    "northern-warrior",

    "baratheon-man-at-arms",

    "dornish-sandshield",

    "tully-river-guard",

    "reach-courtier",

    "lannister-household-knight",

    "vale-spearman",

    // ── Events — 4 ──

    "word-in-the-right-ear",

    "trial-by-combat",

    "oldtown-massacre",

    "brothers-tilt",

    // ── Artifacts — 2 ──

    "blackfyre",

    "dark-sister",

    // ── Locations — 2 ──

    "dragonstone",

    "oldtown",
  ];

  if (deck.length !== 30) {
    throw new Error(
      `Test deck construction error: expected 30 cards, got ${deck.length}.`
    );
  }

  return deck;
}

// ─────────────────────────────────────────────
// Generic stat skeleton validation
// ─────────────────────────────────────────────

/**
 * Generic Characters are not allowed to reuse
 * the same:
 *
 * Cost + Power + Influence + Health
 *
 * combination.
 *
 * Traits do not make duplicate stat skeletons
 * acceptable.
 *
 * Named cards are exempt.
 */
export function validateGenericStatSkeletons(): string[] {
  const errors: string[] = [];

  const generics =
    getAllGameCards().filter(
      (card) =>
        card.cardType ===
          "character" &&
        card.generic
    );

  const seen =
    new Map<
      string,
      string
    >();

  for (const card of generics) {
    if (
      card.cardType !==
      "character"
    ) {
      continue;
    }

    const key = [
      card.cost,
      card.power,
      card.influence,
      card.health,
    ].join(":");

    const existing =
      seen.get(key);

    if (existing) {
      errors.push(
        `Generic stat skeleton collision: ${existing} and ${card.name} both use ${key}.`
      );
    } else {
      seen.set(
        key,
        card.name
      );
    }
  }

  return errors;
}