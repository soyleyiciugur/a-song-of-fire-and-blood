import characters from "./characters/characters.json";
import annals from "./events.json";
import { timeline } from "./timeline";
import { calendarTimelineDate, type CalendarEvent } from "@/lib/calendar";

// These records describe the same scene under different editorial titles.
const annalTimelineTitles: Record<string, string> = {
  "battle-oldtown": "The Oldtown Massacre",
  "nameday-malaenar": "The Nameday Feast on Dragonstone",
  "highgarden-forged-letter-breakfast": "Visenor brings the plot to Highgarden",
  "baelenys-entrusts-aegons-dream": "Baelenys entrusts Jace with Aegon's dream",
  "saera-returns-from-winterfell": "Saera and Alester return from the North",
};

/** Only the public fields needed by the calendar cross the server/client boundary. */
export function getCalendarEvents(): CalendarEvent[] {
  const entries: CalendarEvent[] = [{
    id: "aegons-conquest", title: "Aegon's Conquest", type: "conquest",
    description: "The beginning of the age of Aegon's Conquest. The realm counts its years from this turning of history.",
    day: 1, moon: 1, year: 0,
  }];

  for (const chapter of timeline) {
    chapter.events.forEach((event, index) => {
      const date = calendarTimelineDate(event.date, chapter.date);
      if (!date) return;
      entries.push({ id: `timeline-${chapter.chapterSlug}-${index}`, ...date,
        title: event.title, description: event.description, type: "history",
        href: `/chapters/${chapter.chapterSlug}`, chapterTitle: chapter.chapterTitle, location: event.location });
    });
  }

  for (const event of annals) {
    // Identical titles on the same day represent one entry, with the richer calendar metadata.
    const title = annalTimelineTitles[event.id] ?? event.title;
    const existing = entries.find(entry => entry.href === `/chapters/${event.chapterSlug}` && entry.year === event.year && entry.moon === event.moon && (entry.day === event.day || entry.day === undefined) && entry.title.toLowerCase() === title.toLowerCase());
    if (existing) { existing.day = event.day; existing.type = event.type; existing.location = event.location; continue; }
    entries.push({ id: event.id, title: event.title, description: event.description, type: event.type,
      year: event.year, moon: event.moon, day: event.day, location: event.location,
      href: `/chapters/${event.chapterSlug}`, chapterTitle: timeline.find(chapter => chapter.chapterSlug === event.chapterSlug)?.chapterTitle });
  }

  for (const character of characters) {
    if (character.hidden || !character.nameday) continue;
    if (character.status === "Dead" && !character.death) continue;
    const { day, moon, year } = character.nameday;
    if (day < 1 || day > 30 || moon < 1 || moon > 12) continue;
    entries.push({ id: `nameday-${character.id}`, title: `${character.name}'s Nameday`, type: "nameday",
      description: `The nameday of ${character.name}.`, day, moon, fromYear: year,
      until: character.status === "Dead" ? character.death : undefined,
      href: `/characters/${character.id}` });
  }
  return entries;
}
