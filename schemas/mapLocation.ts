// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\schemas\mapLocation.ts
import { z } from "zod";

export const MapLocationSchema = z.object({
  name: z.string().min(1),
  xPct: z.number(),
  yPct: z.number(),
});

export const MapLocationListSchema = z.array(MapLocationSchema);