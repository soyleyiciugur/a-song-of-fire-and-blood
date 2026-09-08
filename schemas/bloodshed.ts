import { z } from "zod";

export const BloodshedEntrySchema = z.object({
  id: z.string().min(1), title: z.string().min(1), kind: z.enum(["battle", "duel", "tourney"]),
  day: z.number().int().min(1).max(30), moon: z.number().int().min(1).max(12), year: z.number().int().min(1),
  location: z.string().min(1), chapterSlug: z.string().min(1), participants: z.array(z.string()).default([]),
  houses: z.array(z.string()).default([]), summary: z.string().min(1), cause: z.string().min(1), consequence: z.string().min(1),
}).strict();
export const BloodshedListSchema = z.array(BloodshedEntrySchema);
