import { chapters } from "@/data/chapters";

export function getChapters() {
  return Object.values(chapters);
}

export function getChapter(slug: string) {
  return chapters[slug];
}