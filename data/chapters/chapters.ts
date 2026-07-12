// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\data\chapters.ts
//
// Replaces the old data/chapters/ directory (index.ts, chapter1.ts, chapter2.ts, ...).
// All chapters now live in a single data/chapters/chapters.json, edited via the admin panel.
//
// You can safely delete the old data/chapters/ folder once this file is in place.

import chaptersData from "./chapters.json";

export type Chapter = {
  slug: string;
  title: string;
  synopsis: string;
  image: string;
  content: string[];
};

const chapters = chaptersData as Chapter[];

export function getAllChapters(): Chapter[] {
  return chapters;
}

export function getChapter(slug: string): Chapter | undefined {
  return chapters.find((c) => c.slug === slug);
}