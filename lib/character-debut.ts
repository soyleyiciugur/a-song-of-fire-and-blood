import chaptersData from "@/data/chapters.json";
import type { Character } from "@/types/character";
import type { Chapter } from "@/types/chapter";

export type CharacterDebut = Pick<Chapter, "slug" | "title">;

const chapters = chaptersData as Chapter[];

export function getCharacterDebut(character: Character): CharacterDebut | null {
  if (!character.debutChapter) return null;

  const debut = chapters.find((chapter) => chapter.slug === character.debutChapter);
  return debut ? { slug: debut.slug, title: debut.title } : null;
}
