// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\data\chapters\index.ts
// data/chapters/index.ts
import type { Chapter } from "@/types/chapter";
import chaptersData from "../chapters.json";

const chapters: Record<string, Chapter> = Object.fromEntries(
  (chaptersData as Chapter[]).map((c) => [c.slug, c])
);

export const chapterList = Object.values(chapters);

export function getChapter(slug: string): Chapter | undefined {
  return chapters[slug];
}

export function getAllChapters(): Chapter[] {
  return chapterList;
}