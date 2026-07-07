import { characters } from "@/data/characters";
import { getQuotesByCharacterId, quotes } from "@/data/quotes";
import type { Character, CharacterQuote } from "@/types/character";

function portraitFromName(name: string) {
  return `/images/characters/${name
    .toLowerCase()
    .replace(/^ser\s+/i, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")}.webp`;
}

export function getCharacter(id: string): Character | undefined {
  const character = characters[id as keyof typeof characters];

  if (!character) return undefined;

  const quotes = getQuotesByCharacterId(character.id);

  return {
    ...character,
    portrait: character.portrait ?? portraitFromName(character.name),
    quote: quotes[0],
    quotes,
  };
}

export function getCharacters(): Character[] {
  return Object.values(characters).map((c) => {
    const quotes = getQuotesByCharacterId(c.id);
    return {
      ...c,
      portrait: c.portrait ?? portraitFromName(c.name),
      quote: quotes[0],
      quotes,
    };
  });
}

export function getRandomQuote(): CharacterQuote | undefined {
  if (!quotes.length) return undefined;
  return quotes[Math.floor(Math.random() * quotes.length)];
}