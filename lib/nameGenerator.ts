// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\lib\nameGenerator.ts
import { getCulture, Gender } from "@/data/nameGenerator";

export interface GeneratedName {
  given: string;
  surname?: string;
  byname?: string;
  full: string;
}

// Culture-agnostic compound bynames for procedural ("Surprise Me") mode —
// gives smallfolk-style trade/descriptor names without needing a syllable
// bank for every single culture.
const BYNAME_PREFIXES = ["Stone", "Iron", "Swift", "Grey", "Storm", "Silver", "Black", "Frost", "Wind", "Shadow", "Salt", "Ember"];
const BYNAME_SUFFIXES = ["hand", "foot", "heart", "blade", "eye", "born", "walker", "wright", "fist", "song", "shade", "runner"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildFull(given: string, surname?: string, byname?: string): string {
  let full = given;
  if (surname) full += ` ${surname}`;
  if (byname) full += ` ${byname}`;
  return full;
}

function proceduralByname(): string {
  return capitalize(pick(BYNAME_PREFIXES).toLowerCase() + pick(BYNAME_SUFFIXES));
}

export function generateCuratedName(cultureId: string, gender: Gender, includeByname: boolean): GeneratedName | null {
  const culture = getCulture(cultureId);
  if (!culture) return null;

  const given = pick(culture.given[gender]);
  const surname = culture.hasSurnames && culture.surnames.length > 0 ? pick(culture.surnames) : undefined;
  const byname = includeByname && culture.bynames.length > 0 ? pick(culture.bynames) : undefined;

  return { given, surname, byname, full: buildFull(given, surname, byname) };
}

export function generateProceduralName(cultureId: string, gender: Gender, includeByname: boolean): GeneratedName | null {
  const culture = getCulture(cultureId);
  if (!culture) return null;

  const givenBank = culture.syllables.given[gender];
  const given = capitalize(pick(givenBank.start) + pick(givenBank.end).toLowerCase());

  let surname: string | undefined;
  if (culture.hasSurnames) {
    if (culture.syllables.surname) {
      surname = capitalize(pick(culture.syllables.surname.start) + pick(culture.syllables.surname.end).toLowerCase());
    } else if (culture.surnames.length > 0) {
      surname = pick(culture.surnames);
    }
  }

  const byname = includeByname ? proceduralByname() : undefined;

  return { given, surname, byname, full: buildFull(given, surname, byname) };
}

// Generates a name, re-rolling (up to a few tries) if it would exactly repeat
// the previous result — so back-to-back clicks don't hand back the same name
// twice in a row. Small pools (e.g. Dothraki, Free Folk) may still repeat
// after a few tries; that's expected once the pool is nearly exhausted.
export function generateName(
  mode: "curated" | "procedural",
  cultureId: string,
  gender: Gender,
  includeByname: boolean,
  avoidFull?: string
): GeneratedName | null {
  const generate = mode === "curated" ? generateCuratedName : generateProceduralName;

  let result = generate(cultureId, gender, includeByname);
  if (!result) return null;

  let attempts = 0;
  while (avoidFull && result.full === avoidFull && attempts < 8) {
    result = generate(cultureId, gender, includeByname);
    if (!result) return null;
    attempts += 1;
  }

  return result;
}
