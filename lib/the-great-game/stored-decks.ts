import { createTestDeck } from "./deck";

export type StoredDeck = {
  id: string;
  name: string;
  cards: Record<string, number>;
  updatedAt: number;
};

export const DECK_STORAGE_KEY = "the-great-game:decks:v1";
export const PRACTICE_DECK_ID = "practice";

export function readStoredDecks(): StoredDeck[] {
  let decks: StoredDeck[] = [];
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(DECK_STORAGE_KEY) ?? "[]");
    if (Array.isArray(saved)) decks = saved.filter((deck): deck is StoredDeck =>
      Boolean(deck && typeof deck.id === "string" && typeof deck.name === "string" &&
        deck.cards && typeof deck.cards === "object" && !Array.isArray(deck.cards)));
  } catch {
    // A missing or unreadable save starts with the canonical practice roster.
  }
  if (!decks.some(deck => deck.id === PRACTICE_DECK_ID)) {
    const cards: Record<string, number> = {};
    for (const id of createTestDeck()) cards[id] = (cards[id] ?? 0) + 1;
    decks.unshift({ id: PRACTICE_DECK_ID, name: "Practice Deck", cards, updatedAt: Date.now() });
  }
  return decks;
}
