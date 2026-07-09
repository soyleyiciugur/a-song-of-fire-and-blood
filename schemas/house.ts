import { z } from "zod";

export const HouseSchema = z.object({
  id: z.string(),
  name: z.string(),
  words: z.string(),
  seat: z.string(),
  sigilSrc: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  description: z.string(),
}).strict();

export const HouseListSchema = z.array(HouseSchema);

export type HouseFromSchema = z.infer<typeof HouseSchema>;