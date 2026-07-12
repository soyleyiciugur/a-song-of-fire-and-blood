// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\schemas\house.ts
import { z } from "zod";

export const HouseSchema = z.object({
  id: z.string(),
  name: z.string(),
  words: z.string(),
  seat: z.string(),
  sigilSrc: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondaryColor: z.string().optional(), // Eğer bazı hanelerde yoksa .optional() bırakın
  description: z.string(),
}).strict();

export const HouseListSchema = z.array(HouseSchema);

export type HouseFromSchema = z.infer<typeof HouseSchema>;