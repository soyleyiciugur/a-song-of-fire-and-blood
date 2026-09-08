import charactersData from "@/data/characters/characters.json";
import quotesData from "@/data/quotes.json";
import galleryData from "@/data/gallery.json";
import type { Character } from "@/types/character";

const characters = charactersData as Character[];

/**
 * Public/discoverable characters only.
 * Hidden easter-egg characters remain directly resolvable through getCharacter,
 * but disappear from indexes, filters, graphs, search sources, etc. that use this helper.
 */
export function getCharacters(): Character[] {
  return characters.filter((character) => !character.hidden);
}

/** Internal escape hatch for admin/debug tooling that truly needs hidden records. */
export function getAllCharacters(): Character[] {
  return characters;
}

export function getCharacter(id: string) {
  return characters.find((char) => char.id === id);
}

export function getRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotesData.length);
  return quotesData[randomIndex];
}

export function getQuotesByCharacterId(id: string) {
  return quotesData.filter((quote) => quote.speakerId === id);
}

const VIDEO_EXT = [".mp4", ".webm", ".mov"];

function isVideo(src: string) {
  const lower = src.toLowerCase();
  return VIDEO_EXT.some((ext) => lower.endsWith(ext));
}

export function getRandomSeriousGalleryItem() {
  const serious = (galleryData as any[]).filter(
    (item) => item.category === "raven" && !isVideo(item.src)
  );

  if (serious.length === 0) return null;
  return serious[Math.floor(Math.random() * serious.length)];
}
