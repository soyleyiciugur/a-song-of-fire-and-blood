// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\data\map\character-positions.ts
import type { CharacterId } from "@/types/character";
import positionsData from "./character-positions.json";

export type CharacterLocation = string | string[];

export const CHAPTER_CHARACTER_POSITIONS: Record<
  string,
  Partial<Record<CharacterId, CharacterLocation>>
> = positionsData as Record<string, Partial<Record<CharacterId, CharacterLocation>>>;

export function getCharacterPositionsForChapter(
  chapterSlug: string
): Partial<Record<CharacterId, CharacterLocation>> {
  return CHAPTER_CHARACTER_POSITIONS[chapterSlug] ?? {};
}