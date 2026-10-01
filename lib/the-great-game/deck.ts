// lib/the-great-game/deck.ts

import {
  findGameCard,
  getAllGameCards,
  isDeckable,
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

    if (!isDeckable(card)) {
      errors.push(`${card.name} cannot be added to a deck.`);
    }

    counts.set(cardId, (counts.get(cardId) ?? 0) + 1);
  }

  for (const [cardId, count] of counts.entries()) {
    const card = findGameCard(cardId);

    if (!card) {
      continue;
    }

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
    .map((cardId) => findGameCard(cardId))
    .filter(
      (card): card is NonNullable<typeof card> => Boolean(card)
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
      "Deck may contain at most 2 different Locations."
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

export function createTestDeck(): string[] {
  // Practice / feature-coverage mirror deck.
  // Goals: a healthy early curve, examples of every core Character trait,
  // Military + Political threats, late-game aura cards, Dragons, Events,
  // Artifacts and two of the more interaction-heavy Locations.
  const deck: string[] = [
    // 1 Command — reliable opening plays and early trait coverage.
    "dockside-runner",      // Swift
    "little-bird",          // Schemer
    "gate-sentry",          // Guard
    "sept-initiate",        // Intrigue
    "vale-spearman",        // vanilla baseline

    // 2 Command — tempo, protection and glass-cannon pressure.
    "harbor-cutthroat",     // Hull Bladesman; stable id kept for saved decks.
    "court-whisperer",      // Schemer
    "tourneyman-squire",    // Challenge
    "gatehouse-guard",      // Guard
    "ironborn-reaver",      // Greyjoy glass cannon

    // 3 Command — Military / Political interaction.
    "veteran-spearman",     // Challenge
    "court-provocateur",    // Confront
    "reach-courtier",       // Intrigue
    "tully-river-guard",    // Guard

    // Mid-game role coverage.
    "silver-tongued-diplomat", // Confront
    "orwell-morrigen",          // Guard + Experience Triumphs
    "crown-envoy",              // Intrigue
    "royal-spymaster",          // Intrigue + Confront

    // Late-game passive and Dragon coverage.
    "crownlands-champion",  // allied Strength / Health aura
    "grand-counselor",      // allied Influence / Health aura
    "cloudgazer",
    "jhagar",

    // Events — buffing, forced combat and board-wide damage.
    "word-in-the-right-ear",
    "trial-by-combat",
    "brothers-tilt",
    "oldtown-massacre",

    // Artifacts.
    "blackfyre",
    "dark-sister",

    // Locations — modifier amplification + delayed Military poison.
    "oldtown",
    "sunspear",
  ];

  if (deck.length !== 30) {
    throw new Error(
      `Test deck construction error: expected 30 cards, got ${deck.length}.`
    );
  }

  const validation = validateDeck(deck);
  if (!validation.valid) {
    throw new Error(
      `Test deck validation error: ${validation.errors.join(" ")}`
    );
  }

  return deck;
}

/**
 * Generic Characters are not allowed to reuse the same:
 *
 * Cost + Strength + Influence + Health + Traits
 *
 * combination.
 *
 * Identical raw statlines are allowed when the Characters
 * have different Trait sets. Trait order does not matter.
 * Named cards are exempt.
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
    if (card.cardType !== "character") {
      continue;
    }

    const traitKey = [...card.traits]
      .sort()
      .join(",");

    const key = [
      card.cost,
      card.strength,
      card.influence,
      card.health,
      traitKey,
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
