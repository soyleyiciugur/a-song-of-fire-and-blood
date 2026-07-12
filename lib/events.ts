// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\lib\events.ts
import type { MapEvent } from "@/types/map";
import charactersData from "@/data/characters/characters.json";
import eventsData from "@/data/events.json";
import { daysUntilNextNameday, type WorldDate } from "@/lib/age";

const DAYS_PER_MOON = 30;
const YEAR_LENGTH = 12 * DAYS_PER_MOON;

export type UpcomingEventType = "nameday" | "feast" | "wedding" | "battle" | "other";

export interface UpcomingEvent {
  title: string;
  type: UpcomingEventType;
  day: number;
  moon: number;
  year?: number;
  description?: string;
  daysUntil: number;
  href?: string;
}

function dayOfYear(moon: number, day: number) {
  return (moon - 1) * DAYS_PER_MOON + (day - 1);
}

function daysUntil(day: number, moon: number, worldDate: WorldDate) {
  const current = dayOfYear(worldDate.moon, worldDate.day);
  const target = dayOfYear(moon, day);
  const diff = target - current;
  return diff >= 0 ? diff : diff + YEAR_LENGTH;
}

/**
 * A dated event is still "upcoming" only if:
 *  - it has no fixed year (recurs annually — e.g. a traditional feast), or
 *  - its fixed year is strictly in the future, or
 *  - its fixed year is the current year AND its day/moon hasn't passed yet.
 * Anything else (a battle fought last year, a wedding earlier this year)
 * is history, not something to show as "upcoming" on the homepage.
 */
function isStillUpcoming(
  day: number,
  moon: number,
  year: number | undefined,
  worldDate: WorldDate
): boolean {
  if (year === undefined) return true;
  if (year > worldDate.year) return true;
  if (year < worldDate.year) return false;
  return dayOfYear(moon, day) >= dayOfYear(worldDate.moon, worldDate.day);
}

/**
 * Builds a combined, sorted list of upcoming character namedays and
 * calendar events (feasts, weddings, battles, etc.), relative to the
 * given WorldDate. Used by the homepage's "Realm Today" card.
 */
export function getUpcomingEvents(worldDate: WorldDate, limit = 5): UpcomingEvent[] {
  const namedayEvents: UpcomingEvent[] = (charactersData as any[])
    .filter((c) => c.nameday)
    .map((c) => ({
      title: c.name,
      type: "nameday" as const,
      day: c.nameday.day,
      moon: c.nameday.moon,
      daysUntil: daysUntilNextNameday(c.nameday, worldDate),
      href: `/characters/${c.id}`,
    }));

  const calendarEvents: UpcomingEvent[] = (eventsData as any[])
    .filter((e) => isStillUpcoming(e.day, e.moon, e.year, worldDate))
    .map((e) => ({
      title: e.title,
      type: e.type as UpcomingEventType,
      day: e.day,
      moon: e.moon,
      year: e.year,
      description: e.description,
      daysUntil: daysUntil(e.day, e.moon, worldDate),
    }));

  return [...namedayEvents, ...calendarEvents]
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, limit);
}

/**
 * Map-facing accessors — read live from events.json instead of a separate
 * static MAP_EVENTS array. Only events carrying both `location` and
 * `chapterSlug` are map-relevant; homepage-only entries are ignored here.
 */
export function getMapEvents(): MapEvent[] {
  return (eventsData as any[]).filter((e) => e.location && e.chapterSlug);
}

export function getEventsForChapter(chapterSlug: string): MapEvent[] {
  return getMapEvents().filter((e) => e.chapterSlug === chapterSlug);
}