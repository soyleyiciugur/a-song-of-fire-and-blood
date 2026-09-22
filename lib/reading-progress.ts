import { getAllChapters } from "@/data/chapters";

export const READING_PROGRESS_STORAGE_KEY = "asofiab-reading-progress";
export const LEGACY_BOOKMARK_STORAGE_KEY = "asofiab-bookmark";

export type ReadingProgress = {
  chapterSlug: string;
  page: number;
  updatedAt: string;
};

const chapterOrder = new Map(getAllChapters().map((chapter, index) => [chapter.slug, index]));

export function isKnownChapter(slug: string | null | undefined): slug is string {
  return Boolean(slug && chapterOrder.has(slug));
}

export function isWithinSpoilerBoundary(
  contentChapterSlug: string | null | undefined,
  boundaryChapterSlug: string | null | undefined,
) {
  if (!contentChapterSlug) return true;
  if (!boundaryChapterSlug) return false;
  const contentIndex = chapterOrder.get(contentChapterSlug);
  const boundaryIndex = chapterOrder.get(boundaryChapterSlug);
  return contentIndex !== undefined && boundaryIndex !== undefined && contentIndex <= boundaryIndex;
}

export function normalizeReadingProgress(value: unknown): ReadingProgress | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const chapterSlug = typeof candidate.chapterSlug === "string"
    ? candidate.chapterSlug
    : typeof candidate.slug === "string" ? candidate.slug : null;
  const rawPage = candidate.page;
  if (!isKnownChapter(chapterSlug) || typeof rawPage !== "number" || !Number.isFinite(rawPage)) return null;
  return {
    chapterSlug,
    page: Math.max(0, Math.floor(rawPage)),
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date(0).toISOString(),
  };
}
