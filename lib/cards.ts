import tiersData from "@/data/cards/tiers.json";
import {
  findGameCard,
  getAllGameCards,
} from "@/lib/the-great-game/cards";
import type {
  CardType,
  GameCard,
  TierId,
} from "@/lib/the-great-game/types";

export interface TierDefinition {
  id: string;
  label: string;
  order: number;
  color: string;
  accentColor: string;
}

export interface CardAbility {
  name: string;
  description: string;
}

export interface Card {
  id: string;
  cardType: CardType;
  tierId: TierId;
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

function toLegacyCard(card: GameCard): Card {
  return {
    id: card.id,
    cardType: card.cardType,
    tierId: card.tierId,
    name: card.name,
    subtitle: card.subtitle ?? "",
    houseId: card.houseId ?? "",
    power: "strength" in card ? card.strength : 0,
    influence: "influence" in card ? card.influence : 0,
    keywords: card.traits,
    abilities: card.abilities.map((ability) => ({
      name: ability.name,
      description: ability.text,
    })),
    nemesis: [],
    allies: [],
    flavorQuote: card.flavorQuote ?? "",
    linkedCharacterId: card.linkedCharacterId,
  };
}

export function getTiers(): TierDefinition[] {
  return [...(tiersData as TierDefinition[])].sort((a, b) => a.order - b.order);
}

export function getAllCards(): Card[] {
  return getAllGameCards().map(toLegacyCard);
}

export function getCardsByTier(tierId: string): Card[] {
  return getAllCards()
    .filter((c) => c.tierId === tierId)
    .sort((a, b) => (b.power + b.influence) - (a.power + a.influence));
}

export function getCardById(id: string): Card | undefined {
  const card = findGameCard(id);
  return card ? toLegacyCard(card) : undefined;
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
