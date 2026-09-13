import characters from "./characters/characters.json";
import annals from "./events.json";
import { timeline } from "./timeline";
import { calendarTimelineDate, type CalendarCharacterRef, type CalendarEvent } from "@/lib/calendar";


const characterById = new Map(characters.map(character => [character.id, character]));

function toCalendarCharacter(id: string): CalendarCharacterRef | null {
  const character = characterById.get(id);
  if (!character) return null;
  return {
    id: character.id,
    name: character.name,
    nickname: typeof character.nickname === "string" ? character.nickname : undefined,
  };
}

function titleMentionsCharacter(title: string, character: (typeof characters)[number]): boolean {
  const plainName = character.name.replace(/^(?:Grand Maester|Maester|Ser|King|Queen|Prince|Princess|Lord|Lady)\s+/i, "");
  const firstName = plainName.split(/\s+/)[0];
  const candidates = [character.name, plainName, firstName, typeof character.nickname === "string" ? character.nickname : ""]
    .filter((value): value is string => Boolean(value && value.length >= 3));

  return candidates.some(candidate => {
    const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^A-Za-z])${escaped}(?=$|[^A-Za-z])`, "i").test(title);
  });
}

function inferTitleCharacters(title: string): CalendarCharacterRef[] {
  return characters
    .filter(character => !character.hidden && titleMentionsCharacter(title, character))
    .map(character => toCalendarCharacter(character.id))
    .filter((character): character is CalendarCharacterRef => character !== null);
}

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
        href: `/chapters/${chapter.chapterSlug}`, chapterTitle: chapter.chapterTitle, location: event.location,
        characters: (event.characters ?? []).map(toCalendarCharacter).filter((character): character is CalendarCharacterRef => character !== null) });
    });
  }

  for (const event of annals) {
    // Identical titles on the same day represent one entry, with the richer calendar metadata.
    const title = annalTimelineTitles[event.id] ?? event.title;
    const existing = entries.find(entry => entry.href === `/chapters/${event.chapterSlug}` && entry.year === event.year && entry.moon === event.moon && (entry.day === event.day || entry.day === undefined) && entry.title.toLowerCase() === title.toLowerCase());
    if (existing) { existing.day = event.day; existing.type = event.type; existing.location = event.location; continue; }
    entries.push({ id: event.id, title: event.title, description: event.description, type: event.type,
      year: event.year, moon: event.moon, day: event.day, location: event.location,
      href: `/chapters/${event.chapterSlug}`, chapterTitle: timeline.find(chapter => chapter.chapterSlug === event.chapterSlug)?.chapterTitle,
      characters: inferTitleCharacters(event.title) });
  }

  for (const character of characters) {
    if (character.hidden || !character.nameday) continue;
    if (character.status === "Dead" && !character.death) continue;
    const { day, moon, year } = character.nameday;
    if (day < 1 || day > 30 || moon < 1 || moon > 12) continue;
    entries.push({ id: `nameday-${character.id}`, title: `${character.name}'s Nameday`, type: "nameday",
      description: `The nameday of ${character.name}.`, day, moon, fromYear: year,
      until: character.status === "Dead" ? character.death : undefined,
      href: `/characters/${character.id}`, characters: [toCalendarCharacter(character.id)!] });
  }
  return entries;
}
