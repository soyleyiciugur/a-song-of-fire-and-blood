// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\schemas\map.ts
import { z } from "zod";

export const MapEventTypeSchema = z.enum(["battle", "feast", "tournament", "wedding"]);

export const MapLocationSchema = z.object({
  name: z.string().min(1),
  xPct: z.number().min(0).max(100),
  yPct: z.number().min(0).max(100),
}).strict();

export const MapEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: MapEventTypeSchema,
  location: z.string().min(1),
  chapterSlug: z.string().min(1),
  chapterSlugs: z.array(z.string().min(1)).optional(),
  description: z.string().min(1),
}).strict();

export const MapLocationListSchema = z.array(MapLocationSchema);
export const MapEventListSchema = z.array(MapEventSchema);

export type MapLocationFromSchema = z.infer<typeof MapLocationSchema>;
export type MapEventFromSchema = z.infer<typeof MapEventSchema>;
