// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\lib\bookOfBrothers.ts
import entriesData from "@/data/bookOfBrothers.json";
import type { KingsguardEntry } from "@/types/kingsguardEntry";

const entries = entriesData as KingsguardEntry[];

/** All published entries, ordered by appointment date where known (undated entries last). */
export function getAllKingsguardEntries(): KingsguardEntry[] {
  return entries
    .filter((e) => e.published)
    .slice()
    .sort((a, b) => {
      if (!a.appointedDate) return 1;
      if (!b.appointedDate) return -1;
      return a.appointedDate.localeCompare(b.appointedDate);
    });
}

export function getKingsguardEntryById(id: string): KingsguardEntry | undefined {
  return entries.find((e) => e.id === id);
}

export function getPublishedKingsguardEntryById(id: string): KingsguardEntry | undefined {
  return getAllKingsguardEntries().find((e) => e.id === id);
}

export function getKingsguardEntryForCharacter(characterId: string): KingsguardEntry | undefined {
  return getAllKingsguardEntries().find((e) => e.characterId === characterId);
}
