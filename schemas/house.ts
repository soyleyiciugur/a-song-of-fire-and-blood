import { z } from "zod";

export const HouseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  words: z.string().min(1),
  seat: z.string().min(1),
  sigilSrc: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  description: z.string().min(1),
}).strict();

export const HouseListSchema = z.array(HouseSchema);

export type HouseFromSchema = z.infer<typeof HouseSchema>;
