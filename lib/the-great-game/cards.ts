// lib/the-great-game/cards.ts

import cardsData from "@/data/the-great-game/cards.json";

import type {
  CharacterCard,
  DragonCard,
  GameCard,
  Trait,
} from "./types";

const CARDS =
  cardsData as unknown as GameCard[];

const cardsById = new Map<string, GameCard>();
for (const card of CARDS) {
  if (!cardsById.has(card.id)) cardsById.set(card.id, card);
}

export function getAllGameCards(): GameCard[] {
  return CARDS;
}

export function getAllDeckableGameCards(): GameCard[] {
  return CARDS.filter(
    (card) =>
      card.deckable !== false
  );
}

export function getGameCard(
  cardId: string
): GameCard {
  const card = cardsById.get(cardId);

  if (!card) {
    throw new Error(
      `The Great Game card not found: ${cardId}`
    );
  }

  return card;
}

export function findGameCard(
  cardId: string
): GameCard | undefined {
  return cardsById.get(cardId);
}

export function getCharacterCard(
  cardId: string
): CharacterCard | undefined {
  const card =
    findGameCard(cardId);

  return card?.cardType ===
    "character"
    ? card
    : undefined;
}

export function getDragonCard(
  cardId: string
): DragonCard | undefined {
  const card =
    findGameCard(cardId);

  return card?.cardType ===
    "dragon"
    ? card
    : undefined;
}

export function isUnitCard(
  card: GameCard
): card is
  | CharacterCard
  | DragonCard {
  return (
    card.cardType ===
      "character" ||
    card.cardType ===
      "dragon"
  );
}

export function hasTrait(
  card: GameCard,
  trait: Trait
): boolean {
  return card.traits.includes(
    trait
  );
}

export function isUnique(
  card: GameCard
): boolean {
  return hasTrait(
    card,
    "unique"
  );
}

export function isDeckable(
  card: GameCard
): boolean {
  return card.deckable !== false;
}