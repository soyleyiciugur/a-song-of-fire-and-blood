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
  // Generic Characters are intentionally excluded except the two 7-Command
  // positioning auras. The curve uses named Characters with live engine
  // abilities so early, mid and late gameplay can all be exercised.
  const deck: string[] = [
    // 2 Command — named early plays with working passive abilities.
    "naela-targaryen",       // Ready: cannot be targeted by enemy Events.
    "leo-tyrell",            // Grows when Visenor / Tyrell / Hightower arrives.

    // 3 Command — early Political / damage / Standing interactions.
    "rhaella-targaryen",     // First enemy Political Conflict: -2 Influence while Ready.
    "perric-bracken",        // First Event damage each turn: prevent 2.
    "clover-tully",          // Both Rulers +2 Standing, then draw 1.

    // 4 Command.
    "cordin-poole",          // Start-turn draw engine.
    "weylar-rocke",          // Long-term turn-cycle payoff.
    "rickard-stark",         // Adjacent +1 Influence.

    // 5 Command.
    "renrose-tyrell",        // Required: The Mander's Pact + Confront.
    "lorent-tyrell",         // Fall draw; Renrose synergy.
    "saera-targaryen",       // Veiled Sight + Cloudgazer bond.
    "orwell-morrigen",       // Experience Triumphs + Guard.
    "saathos-maris",         // Adjacent +1 Health.

    // 6–8 Command named finishers / trait coverage.
    "jacaelon-targaryen",    // Silent Verdict + Schemer + Jhagar bond.
    "gaelor-targaryen",      // Housebreaker + Swift.
    "alester-dayne",         // Dawn's Edge + Guard + Challenge.
    "baelenys-targaryen",    // Required: Iron Wrath + Maelwing bond.

    // The only generic Characters in the practice deck.
    "crownlands-champion",    // Adjacent Strength / Health aura.
    "grand-counselor",        // Adjacent Influence / Health aura.

    // Bonded Dragons.
    "jhagar",
    "cloudgazer",
    "maelwing",

    // Events.
    "word-in-the-right-ear",
    "trial-by-combat",
    "brothers-tilt",
    "oldtown-massacre",

    // Artifacts.
    "blackfyre",
    "dark-sister",

    // Locations.
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
