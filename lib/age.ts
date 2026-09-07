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

export type CharacterAgeState =
  | "baby"
  | "kid"
  | "teen"
  | "young"
  | "adult"
  | "old";

export const CHARACTER_AGE_STATES: CharacterAgeState[] = [
  "baby",
  "kid",
  "teen",
  "young",
  "adult",
  "old",
];

export const DAYS_PER_MOON = 30;
export const MOONS_PER_YEAR = 12;
export const DAYS_PER_YEAR = DAYS_PER_MOON * MOONS_PER_YEAR;

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
 * Maps an in-world age to the portrait buckets used under
 * public/images/characters/{ageState}/.
 *
 * `portraitAgeState` on a character can override this when the artwork/lore
 * calls for a different visual bucket.
 */
export function ageToPortraitState(age: number): CharacterAgeState {
  if (age <= 2) return "baby";
  if (age <= 11) return "kid";
  if (age <= 16) return "teen";
  if (age <= 25) return "young";
  if (age <= 59) return "adult";
  return "old";
}

export function resolvePortraitAgeState(
  age: number | undefined,
  override?: CharacterAgeState | null
): CharacterAgeState {
  if (override) return override;
  return age === undefined ? "adult" : ageToPortraitState(age);
}

/** Days until this character's next nameday in the 12x30 world calendar. */
export function daysUntilNextNameday(
  nameday: Nameday,
  worldDate: WorldDate
): number {
  const current = dayOfYear(worldDate.moon, worldDate.day);
  const target = dayOfYear(nameday.moon, nameday.day);
  const diff = target - current;

  return diff >= 0 ? diff : diff + DAYS_PER_YEAR;
}

/** Shared wording for nameday/event countdowns across the site. */
export function formatDaysUntil(daysUntil: number): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `in ${daysUntil} days`;
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

function dayOfYear(moon: number, day: number): number {
  return (moon - 1) * DAYS_PER_MOON + (day - 1);
}

function formatDate(
  date: { day: number; moon: number; year: number },
  era: string
): string {
  return `${ordinal(date.day)} day of the ${ordinal(
    date.moon
  )} moon, ${date.year} ${era}`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;

  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}
