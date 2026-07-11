import scrollsData from "@/data/scrolls.json";
import type { Scroll, ScrollCategory } from "@/types/scroll";

const scrolls = scrollsData as Scroll[];

/** All published scrolls. Use this for public-facing pages. */
export function getAllScrolls(): Scroll[] {
  return scrolls.filter((s) => s.published);
}

/** A single scroll by ID, regardless of publish state (used by admin). */
export function getScrollById(id: string): Scroll | undefined {
  return scrolls.find((s) => s.id === id);
}

/** A single published scroll by ID (used by public pages). */
export function getPublishedScrollById(id: string): Scroll | undefined {
  return getAllScrolls().find((s) => s.id === id);
}

export function getScrollsByCategory(category: ScrollCategory): Scroll[] {
  return getAllScrolls().filter((s) => s.category === category);
}

export function getScrollsForCharacter(characterId: string): Scroll[] {
  return getAllScrolls().filter((s) =>
    s.relatedCharacterIds?.includes(characterId)
  );
}

export function getScrollsForHouse(houseName: string): Scroll[] {
  return getAllScrolls().filter((s) => s.relatedHouses?.includes(houseName));
}

export function getScrollCategories(): ScrollCategory[] {
  const set = new Set(getAllScrolls().map((s) => s.category));
  return Array.from(set);
}
