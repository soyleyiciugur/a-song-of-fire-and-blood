// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\data\map\resolve-character-status.ts
import type { CharacterId } from "@/types/character";
import { CHAPTER_CHARACTER_POSITIONS, type CharacterLocation } from "./character-positions";

export type CharacterMapStatus = "alive" | "dead" | "unknown";

export interface ResolvedCharacterPosition {
  /** The location to actually render the avatar at (full hop path if this
   * chapter shows real movement, otherwise the single frozen last-known spot). */
  location: CharacterLocation;
  /** "dead" -> red X, "unknown" -> black "?", "alive" -> normal. */
  status: CharacterMapStatus;
}

export type ResolvedChapterPositions = Partial
  Record<CharacterId, ResolvedCharacterPosition>
;

function lastStop(location: CharacterLocation): string {
  return Array.isArray(location) ? location[location.length - 1] : location;
}

/**
 * Walks chapters in the given order and, for each chapter, resolves every
 * character's effective map location + status.
 *
 * Rules:
 * - A real location value ("King's Landing", ["A","B"], etc.) always
 *   overwrites the last-known location and resets status to "alive". The
 *   full hop path is shown for that chapter (movement trail within it).
 * - "Dead" freezes the character at their last-known *single* location
 *   (just the final stop, not the whole hop path) and marks status "dead".
 *   If they never had a real location before, they don't render.
 * - "-" does the same, marking status "unknown" instead.
 * - If a "Dead" or "-" character later gets a real location again, they
 *   snap back to "alive" at that new location automatically.
 */
export function resolveCharacterPositionsInOrder(
  orderedChapterSlugs: string[]
): Record<string, ResolvedChapterPositions> {
  const lastKnownStop: Partial<Record<CharacterId, string>> = {};
  const result: Record<string, ResolvedChapterPositions> = {};

  for (const slug of orderedChapterSlugs) {
    const chapterData = CHAPTER_CHARACTER_POSITIONS[slug] ?? {};
    const resolvedChapter: ResolvedChapterPositions = {};

    for (const [charId, rawValue] of Object.entries(chapterData) as [
      CharacterId,
      CharacterLocation,
    ][]) {
      if (rawValue === "Dead") {
        const frozen = lastKnownStop[charId];
        if (frozen) {
          resolvedChapter[charId] = { location: frozen, status: "dead" };
        }
        continue;
      }

      if (rawValue === "-") {
        const frozen = lastKnownStop[charId];
        if (frozen) {
          resolvedChapter[charId] = { location: frozen, status: "unknown" };
        }
        continue;
      }

      // Real location: update last-known single stop, show full path, mark alive.
      lastKnownStop[charId] = lastStop(rawValue);
      resolvedChapter[charId] = { location: rawValue, status: "alive" };
    }

    result[slug] = resolvedChapter;
  }

  return result;
}