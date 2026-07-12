// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\schemas\worldDate.ts
import { z } from "zod";

export const WorldDateSchema = z.object({
  day: z.number().int().min(1).max(30),
  moon: z.number().int().min(1).max(12),
  year: z.number().int(),
  era: z.enum(["AC", "BC"]),
});

export type WorldDate = z.infer<typeof WorldDateSchema>;
