// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\lib\age.ts
export interface Nameday {
  day: number;
  moon: number;
  year: number;
}

export interface WorldDate {
  day: number;
  moon: number;
  year: number;
  era: string;
}

/**
 * Computes a character's current in-world age from their nameday and the
 * site's current WorldDate. Accounts for whether their nameday has already
 * occurred this year (day/moon-wise) relative to the current date — so age
 * ticks up automatically as the admin advances the calendar, instead of
 * being a static number that has to be hand-edited.
 */
export function computeAge(nameday: Nameday, worldDate: WorldDate): number {
  const hadNamedayThisYear =
    nameday.moon < worldDate.moon ||
    (nameday.moon === worldDate.moon && nameday.day <= worldDate.day);

  const age = worldDate.year - nameday.year - (hadNamedayThisYear ? 0 : 1);
  return Math.max(0, age);
}

/**
 * Days until this character's next nameday, from the current WorldDate.
 * Ignores year — only cares about day-of-year cycling. Useful for an
 * "upcoming namedays" admin widget later, if wanted.
 */
export function daysUntilNextNameday(nameday: Nameday, worldDate: WorldDate): number {
  const DAYS_PER_MOON = 30;
  const dayOfYear = (moon: number, day: number) => (moon - 1) * DAYS_PER_MOON + (day - 1);

  const YEAR_LENGTH = 12 * DAYS_PER_MOON;
  const current = dayOfYear(worldDate.moon, worldDate.day);
  const target = dayOfYear(nameday.moon, nameday.day);

  const diff = target - current;
  return diff >= 0 ? diff : diff + YEAR_LENGTH;
}

/**
 * Formats a nameday the same way the Tools page formats the current world
 * date, e.g. "4th day of the 11th moon, 81 AC".
 */
export function formatNameday(nameday: Nameday, era: string): string {
  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
  };
  return `${ordinal(nameday.day)} day of the ${ordinal(nameday.moon)} moon, ${nameday.year} ${era}`;
}