// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\lib\chapters.ts
import { chapters } from "@/data/chapters";

export function getChapters() {
  return Object.values(chapters);
}

export function getChapter(slug: string) {
  return chapters[slug];
}