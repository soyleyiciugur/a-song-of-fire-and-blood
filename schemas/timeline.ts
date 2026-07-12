// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\schemas\timeline.ts
import { z } from "zod";

export const TimelineEventSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  date: z.string().optional(),
  characters: z.array(z.string()).optional(),
});

export const TimelineChapterSchema = z.object({
  chapterSlug: z.string().min(1),
  chapterTitle: z.string().min(1),
  date: z.string().optional(),
  events: z.array(TimelineEventSchema),
});

export const TimelineListSchema = z.array(TimelineChapterSchema);