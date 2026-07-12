// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\schemas\chapter.ts
import { z } from "zod";

export const ChapterSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  synopsis: z.string(),
  image: z.string(),
  content: z.array(z.string()),
});

export const ChapterListSchema = z.array(ChapterSchema);

export type Chapter = z.infer<typeof ChapterSchema>;