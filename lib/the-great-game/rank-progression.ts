import type { TierId } from "./types";

/** Existing rating tiers. C has no promotion threshold; 1000 is a starting rating, not a rank boundary. */
export const RATING_MILESTONES: readonly { id: TierId; label: string; threshold: number | null }[] = [
  { id: "c", label: "C", threshold: null },
  { id: "b", label: "B", threshold: 1100 },
  { id: "a", label: "A", threshold: 1200 },
  { id: "s", label: "S", threshold: 1350 },
  { id: "s-plus", label: "S+", threshold: 1500 },
];

/** Presentation only: consume the authoritative Ranked rating, never match counts or season points. */
export function ratingProgression(rating: number) {
  const currentIndex = RATING_MILESTONES.reduce((index, milestone, candidate) =>
    milestone.threshold !== null && rating >= milestone.threshold ? candidate : index, 0);
  const current = RATING_MILESTONES[currentIndex];
  const next = RATING_MILESTONES[currentIndex + 1] ?? null;
  const nextThreshold = next?.threshold ?? null;
  return {
    rating,
    current,
    next,
    pointsToNext: nextThreshold === null ? null : Math.max(0, nextThreshold - rating),
    // Do not invent a lower C boundary or a next milestone beyond S+.
    fraction: current.threshold === null || nextThreshold === null ? null :
      Math.max(0, Math.min(1, (rating - current.threshold) / (nextThreshold - current.threshold))),
    milestones: RATING_MILESTONES.map((milestone, index) => ({
      ...milestone,
      state: index < currentIndex ? "completed" as const : index === currentIndex ? "current" as const : "upcoming" as const,
    })),
  };
}

export function playerTierForRating(rating: number): TierId {
  return ratingProgression(rating).current.id;
}

export function playerTierLabel(rating: number) {
  return ratingProgression(rating).current.label;
}
