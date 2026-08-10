// This file is a-song-of-fire-and-blood\lib\cards.ts
import tiersData from "@/data/cards/tiers.json";
import cardsData from "@/data/cards/cards.json";

export interface TierDefinition {
  id: string;
  label: string;
  order: number;
  color: string;
  accentColor: string;
}

export type CardType = "character" | "dragon" | "artifact" | "event" | "location";

export interface CardAbility {
  name: string;
  description: string;
}

export interface Card {
  id: string;
  cardType: CardType;
  tierId: string;
  name: string;
  subtitle: string;
  houseId: string;
  power: number;
  influence: number;
  keywords: string[];
  abilities: CardAbility[];
  nemesis: string[];
  allies: string[];
  flavorQuote: string;
  linkedCharacterId?: string;
}

export function getTiers(): TierDefinition[] {
  return [...(tiersData as TierDefinition[])].sort((a, b) => a.order - b.order);
}

export function getAllCards(): Card[] {
  return cardsData as Card[];
}

export function getCardsByTier(tierId: string): Card[] {
  return getAllCards().filter((c) => c.tierId === tierId);
}

export function getCardById(id: string): Card | undefined {
  return getAllCards().find((c) => c.id === id);
}

export function getCardsByIds(ids: string[]): Card[] {
  return ids
    .map((id) => getCardById(id))
    .filter((c): c is Card => Boolean(c));
}

export const CARD_TYPE_ICON: Record<CardType, string> = {
  character: "⚔️",
  dragon: "🐉",
  artifact: "🗡️",
  event: "📜",
  location: "🏰",
};