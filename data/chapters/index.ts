import type { Chapter } from "@/types/chapter";

import ThePoisonBeneathTheCrown from "./the-poison-beneath-the-crown";
import ThePriceOfTrust from "./the-price-of-trust";
import TheWeightOfLoyalty from "./the-weight-of-loyalty";

export const chapters: Record<string, Chapter> = {
  [ThePoisonBeneathTheCrown.slug]: ThePoisonBeneathTheCrown,
  [ThePriceOfTrust.slug]: ThePriceOfTrust,
  [TheWeightOfLoyalty.slug]: TheWeightOfLoyalty,
};

export const chapterList = Object.values(chapters);

export function getChapter(slug: string): Chapter | undefined {
  return chapters[slug];
}

export function getAllChapters(): Chapter[] {
  return chapterList;
}