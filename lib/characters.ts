import { characters } from "@/data/characters";
import type { Character } from "@/types/character";

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

  return {
    ...character,
    portrait: character.portrait ?? portraitFromName(character.name),
  };
}

export function getCharacters(): Character[] {
  return Object.values(characters).map((c) => ({
    ...c,
    portrait: c.portrait ?? portraitFromName(c.name),
  }));
}