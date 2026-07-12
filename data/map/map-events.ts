import type { MapEvent } from "@/types/map";
import eventsData from "@/data/events.json";

// MAP_EVENTS is now derived from the shared data/events.json (also used by
// the homepage's upcoming-events list). Only events with both a `location`
// and `chapterSlug` are relevant to the map — homepage-only events (e.g.
// namedays, which are generated from character data, not this file) simply
// won't have those fields and are filtered out here.
export const MAP_EVENTS: MapEvent[] = (eventsData as any[]).filter(
  (e) => e.location && e.chapterSlug
);

export function getEventsForChapter(chapterSlug: string): MapEvent[] {
  return MAP_EVENTS.filter((e) => e.chapterSlug === chapterSlug);
}