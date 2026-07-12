// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\lib\houses.ts
import { getCharacters } from "@/lib/characters";
import type { Character } from "@/types/character";

export interface HouseSummary {
  slug: string;
  name: string;
  members: Character[];
}

/**
 * Converts a house name (e.g. "House Targaryen") into a URL-safe slug
 * (e.g. "targaryen"). Exported so other modules (like CharacterInfoBox)
 * can link to a house page without duplicating the logic.
 */
export function slugifyHouse(house: string): string {
  return house
    .replace(/^house\s+/i, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

/**
 * Groups every character by their `house` field. Characters with no
 * house ("-") are skipped, since they don't belong to any sworn house.
 */
export function getHouses(): HouseSummary[] {
  const characters = getCharacters();
  const houses = new Map<string, HouseSummary>();

  for (const character of characters) {
    if (!character.house || character.house === "-") continue;

    const slug = slugifyHouse(character.house);

    if (!houses.has(slug)) {
      houses.set(slug, { slug, name: character.house, members: [] });
    }

    houses.get(slug)!.members.push(character);
  }

  return Array.from(houses.values()).sort((a, b) => {
    if (b.members.length !== a.members.length) {
      return b.members.length - a.members.length;
    }
    return a.name.localeCompare(b.name);
  });
}

export function getHouse(slug: string): HouseSummary | undefined {
  return getHouses().find((house) => house.slug === slug);
}
