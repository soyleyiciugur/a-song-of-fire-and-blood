// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\data\timeline.ts
import timelineData from "./timeline.json";

export type TimelineEvent = {
  title: string;
  description: string;
  date?: string;
  characters?: string[];
};

export type TimelineChapter = {
  chapterSlug: string;
  chapterTitle: string;
  date?: string;
  events: TimelineEvent[];
};

export const timeline: TimelineChapter[] = timelineData as TimelineChapter[];