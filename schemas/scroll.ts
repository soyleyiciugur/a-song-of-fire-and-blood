import { z } from "zod";

export const ScrollCategorySchema = z.enum([
  "Natural History",
  "Religion & Faith",
  "War & Conquest",
  "Medicine & Affliction",
  "Genealogy & Lineage",
  "Law & Governance",
  "Myth & Legend",
]);

export const ScrollSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  author: z.string().default("Unknown"),
  authorTitle: z.string().optional(),
  category: ScrollCategorySchema.default("Natural History"),
  summary: z.string().default(""),
  content: z.string().default(""),
  relatedCharacterIds: z.array(z.string()).default([]),
  relatedHouses: z.array(z.string()).default([]),
  chapterRef: z.string().optional(),
  dateWritten: z.string().optional(),
  sealHouse: z.string().optional(),
  published: z.boolean().default(false),
}).strict();

export const ScrollListSchema = z.array(ScrollSchema);

export type ScrollFromSchema = z.infer<typeof ScrollSchema>;
