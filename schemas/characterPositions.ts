// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\schemas\characterPositions.ts
import { z } from "zod";

const LocationValueSchema = z.union([z.string(), z.array(z.string())]);

export const CharacterPositionsSchema = z.record(
  z.string(), // chapterSlug
  z.record(z.string(), LocationValueSchema) // characterId -> location(s)
);