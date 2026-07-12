// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\schemas\dragon.ts
import { z } from "zod";

export const DragonSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(["Alive", "Dead"]),
  riderId: z.string().optional(),
  previousRiderId: z.string().optional(),
  image: z.string(),
  traits: z.array(z.string()),
  description: z.string(),
});

export const DragonListSchema = z.array(DragonSchema);