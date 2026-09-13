import { parseTimelineDate, timelineDateOrder } from "./timeline-date";

export type CalendarDate = { day: number; moon: number; year: number };
export type CalendarEvent = {
  id: string;
  title: string;
  type: string;
  description: string;
  moon: number;
  year?: number;
  day?: number;
  endDay?: number;
  dateLabel?: string;
  fromYear?: number;
  until?: CalendarDate;
  href?: string;
  chapterTitle?: string;
  location?: string;
};

export const CALENDAR_TYPES = ["nameday", "feast", "battle", "trial", "wedding", "tournament"] as const;
export const CALENDAR_LABELS: Record<string, string> = {
  nameday: "Nameday", feast: "Feast", battle: "Battle", trial: "Trial",
  wedding: "Wedding", tournament: "Tourney", history: "Chronicle", conquest: "Conquest",
};

export function ordinal(value: number): string {
  const lastTwo = value % 100;
  const suffix = lastTwo >= 11 && lastTwo <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[value % 10] ?? "th";
  return `${value}${suffix}`;
}

export function calendarDateLabel(date: CalendarDate): string {
  return `${ordinal(date.day)} of the ${ordinal(date.moon)} Moon, ${date.year} AC`;
}

export function calendarDateFromOrder(order: number): CalendarDate {
  return { year: Math.floor(order / 360), moon: Math.floor((order % 360) / 30) + 1, day: order % 30 + 1 };
}

export function calendarHref(date: CalendarDate): string {
  return `/calendar?year=${date.year}&moon=${date.moon}&day=${date.day}`;
}

/** Approximate dates belong to a moon, never to an invented precise day. */
export function calendarTimelineDate(date?: string, chapterDate?: string): Pick<CalendarEvent, "day" | "endDay" | "moon" | "year" | "dateLabel"> | null {
  const order = parseTimelineDate(date, chapterDate);
  if (!Number.isFinite(order)) return null;
  const parsed = calendarDateFromOrder(order);
  const label = date ?? chapterDate ?? "";
  const exact = label.match(/^(\d+)(?:st|nd|rd|th)?(?:\s*[–-]\s*(\d+)(?:st|nd|rd|th)?)?\s+of\s+(?:the\s+)?/i);
  return { year: parsed.year, moon: parsed.moon, day: exact ? parsed.day : undefined, endDay: exact?.[2] ? Number(exact[2]) : undefined, dateLabel: /\bAC\b/.test(label) ? label : `${label}, ${parsed.year} AC` };
}

export function eventsInMoon(events: CalendarEvent[], year: number, moon: number): CalendarEvent[] {
  return events.filter(event => event.moon === moon && (event.year === undefined || event.year === year)
    && (event.fromYear === undefined || year >= event.fromYear)
    && (!event.until || timelineDateOrder({ year, moon, day: event.day ?? 1 }) <= timelineDateOrder(event.until)));
}

export function eventsOnDay(events: CalendarEvent[], day: number): CalendarEvent[] {
  return events.filter(event => event.day !== undefined && day >= event.day && day <= (event.endDay ?? event.day));
}
