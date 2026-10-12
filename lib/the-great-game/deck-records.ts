import { createTestDeck, validateDeck, type DeckValidationResult } from "./deck";
import type { StoredDeck } from "./stored-decks";

/** Expand only bounded, integral counts; never silently repair a saved deck. */
export function deckCards(deck: Pick<StoredDeck, "cards"> | null | undefined): string[] {
  if (!deck) return createTestDeck();
  const entries = Object.entries(deck.cards);
  if (entries.some(([, count]) => !Number.isSafeInteger(count) || count < 0 || count > 30)) {
    throw new Error("This deck contains invalid card quantities. Remove those entries before playing.");
  }
  if (entries.reduce((sum, [, count]) => sum + count, 0) > 30) throw new Error("Deck must contain exactly 30 cards. Remove the extra cards.");
  return entries.flatMap(([id, count]) => Array.from({ length: count }, () => id));
}
export function validateStoredDeck(deck: Pick<StoredDeck, "cards"> | null | undefined): DeckValidationResult {
  try { return validateDeck(deckCards(deck)); }
  catch (error) { return { valid: false, errors: [error instanceof Error ? error.message : "The deck could not be read."] }; }
}
/** Card order and deck names are irrelevant; edits to the roster create a new version. */
export function deckSignature(cards: string[]): string { return JSON.stringify([...cards].sort()); }
export type DeckRecord = { signature: string; games: number; wins: number; losses: number; draws: number; abandons: number; winRate: number };
export function addDeckResult(records: Map<string, DeckRecord>, cards: string[], result: "win" | "loss" | "draw" | "abandon") {
  const signature = deckSignature(cards);
  const record = records.get(signature) ?? { signature, games: 0, wins: 0, losses: 0, draws: 0, abandons: 0, winRate: 0 };
  record.games++;
  if (result === "win") record.wins++;
  else if (result === "draw") record.draws++;
  else { record.losses++; if (result === "abandon") record.abandons++; }
  record.winRate = Math.round(record.wins / record.games * 1000) / 10;
  records.set(signature, record);
}
