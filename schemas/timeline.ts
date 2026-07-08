import { z } from "zod";

export const TimelineEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  characters: z.array(z.string().min(1)).optional(),
}).strict();

export const TimelineChapterSchema = z.object({
  chapterSlug: z.string().min(1),
  chapterTitle: z.string().min(1),
  events: z.array(TimelineEventSchema),
}).strict();

export const TimelineSchema = z.array(TimelineChapterSchema);

export type TimelineChapterFromSchema = z.infer<typeof TimelineChapterSchema>;
