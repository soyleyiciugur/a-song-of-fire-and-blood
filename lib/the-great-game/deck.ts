// lib/the-great-game/deck.ts

import {
  findGameCard,
  getAllGameCards,
  isUnique,
  isUnitCard,
} from "./cards";

export interface DeckValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateDeck(
  cardIds: string[]
): DeckValidationResult {
  const errors: string[] = [];

  if (cardIds.length !== 30) {
    errors.push(
      `Deck must contain exactly 30 cards. Current: ${cardIds.length}.`
    );
  }

  const counts = new Map<string, number>();

  for (const cardId of cardIds) {
    const card = findGameCard(cardId);

    if (!card) {
      errors.push(`Unknown card: ${cardId}`);
      continue;
    }

    counts.set(cardId, (counts.get(cardId) ?? 0) + 1);
  }

  for (const [cardId, count] of counts.entries()) {
    const card = findGameCard(cardId);

    if (!card) continue;

    const maxCopies = isUnique(card) ? 1 : 2;

    if (count > maxCopies) {
      errors.push(
        `${card.name} allows maximum ${maxCopies} ${
          maxCopies === 1 ? "copy" : "copies"
        }.`
      );
    }
  }

  const validCards = cardIds
    .map(findGameCard)
    .filter((card): card is NonNullable<typeof card> =>
      Boolean(card)
    );

  const unitCount = validCards.filter(isUnitCard).length;

  if (unitCount < 15) {
    errors.push(
      `Deck must contain at least 15 Characters/Dragons. Current: ${unitCount}.`
    );
  }

  const locations = validCards.filter(
    (card) => card.cardType === "location"
  );

  const distinctLocations = new Set(
    locations.map((card) => card.id)
  );

  if (distinctLocations.size > 2) {
    errors.push(
      `Deck may contain at most 2 different Locations.`
    );
  }

  for (const locationId of distinctLocations) {
    const count = counts.get(locationId) ?? 0;

    if (count > 1) {
      const location = findGameCard(locationId);

      errors.push(
        `${location?.name ?? locationId} may only appear once in a deck.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Temporary test deck.
 *
 * This is deliberately not a final balanced deck.
 * It only exists so the local engine can boot
 * without requiring a deck builder first.
 */
export function createTestDeck(): string[] {
  const deck = [
    // Named
    "jacaelon-targaryen",
    "gaelor-targaryen",
    "alester-dayne",
    "renrose-tyrell",
    "cordin-poole",
    "saera-targaryen",
    "baelenys-targaryen",
    "weylar-rocke",

    // Dragons
    "jhagar",
    "cloudgazer",
    "maelwing",

    // Generics x2
    "northern-warrior",
    "northern-warrior",

    "baratheon-man-at-arms",
    "baratheon-man-at-arms",

    "dornish-sandshield",
    "dornish-sandshield",

    "tully-river-guard",
    "tully-river-guard",

    "reach-courtier",
    "reach-courtier",

    "lannister-household-knight",
    "lannister-household-knight",

    // Events
    "trial-by-combat",
    "oldtown-massacre",
    "brothers-tilt",

    // Artifacts
    "blackfyre",
    "dark-sister",

    // Locations
    "dragonstone",
    "kings-landing",
  ];

  if (deck.length !== 30) {
    throw new Error(
      `Test deck construction error: expected 30 cards, got ${deck.length}.`
    );
  }

  return deck;
}

/**
 * Dev helper: validates the card database itself.
 */
export function validateGenericStatSkeletons(): string[] {
  const errors: string[] = [];

  const generics = getAllGameCards().filter(
    (card) =>
      card.cardType === "character" &&
      card.generic
  );

  const seen = new Map<string, string>();

  for (const card of generics) {
    if (card.cardType !== "character") continue;

    const key = [
      card.cost,
      card.power,
      card.influence,
      card.health,
    ].join(":");

    const existing = seen.get(key);

    if (existing) {
      errors.push(
        `Generic stat skeleton collision: ${existing} and ${card.name} both use ${key}.`
      );
    } else {
      seen.set(key, card.name);
    }
  }

  return errors;
}