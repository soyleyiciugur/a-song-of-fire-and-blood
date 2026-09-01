// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\lib\age.ts

export interface Nameday {
  day: number;
  moon: number;
  year: number;
}

export interface DeathDate {
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
 * Computes a character's age.
 *
 * Living character:
 *   age is calculated against the current world date.
 *
 * Dead character:
 *   age is frozen at the character's death date.
 */
export function computeAge(
  nameday: Nameday,
  worldDate: WorldDate,
  death?: DeathDate
): number {
  const referenceDate = death ?? worldDate;

  const hadNamedayThatYear =
    nameday.moon < referenceDate.moon ||
    (nameday.moon === referenceDate.moon &&
      nameday.day <= referenceDate.day);

  const age =
    referenceDate.year -
    nameday.year -
    (hadNamedayThatYear ? 0 : 1);

  return Math.max(0, age);
}

/**
 * Days until this character's next nameday.
 */
export function daysUntilNextNameday(
  nameday: Nameday,
  worldDate: WorldDate
): number {
  const DAYS_PER_MOON = 30;

  const dayOfYear = (moon: number, day: number) =>
    (moon - 1) * DAYS_PER_MOON + (day - 1);

  const YEAR_LENGTH = 12 * DAYS_PER_MOON;

  const current = dayOfYear(worldDate.moon, worldDate.day);
  const target = dayOfYear(nameday.moon, nameday.day);

  const diff = target - current;

  return diff >= 0 ? diff : diff + YEAR_LENGTH;
}

export function formatNameday(
  nameday: Nameday,
  era: string
): string {
  return formatDate(nameday, era);
}

export function formatDeathDate(
  death: DeathDate,
  era: string
): string {
  return formatDate(death, era);
}

function formatDate(
  date: { day: number; moon: number; year: number },
  era: string
): string {
  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;

    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
  };

  return `${ordinal(date.day)} day of the ${ordinal(
    date.moon
  )} moon, ${date.year} ${era}`;
}