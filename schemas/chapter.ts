import { z } from "zod";

export const ChapterSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  synopsis: z.string().min(1),
  content: z.array(z.string()),
  image: z.string().min(1),
}).strict();

export const ChapterRecordSchema = z.record(z.string(), ChapterSchema);

export type ChapterFromSchema = z.infer<typeof ChapterSchema>;
