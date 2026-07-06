import type { ReactNode } from "react";
import Link from "next/link";

import { getCharacters } from "@/lib/characters";
import styles from "@/components/chapter/linkedParagraph.module.css";

interface PatternCache {
  regex: RegExp | null;
  idByPhrase: Map<string, string>;
}

let cache: PatternCache | null = null;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds the lookup table of every phrase (full name, first name, nickname,
 * alias) that should resolve to a character, and a single alternation regex
 * ordered from longest to shortest phrase so multi-word names are matched
 * before their component words.
 */
function buildPatternCache(): PatternCache {
  if (cache) return cache;

  const idByPhrase = new Map<string, string>();

  for (const character of getCharacters()) {
    const candidates = new Set<string>();

    candidates.add(character.name);

    const firstName = character.name.replace(/^Ser\s+/i, "").split(" ")[0];
    if (firstName && firstName.length >= 3) candidates.add(firstName);

    if (character.nickname && character.nickname !== "-") {
      candidates.add(character.nickname);
    }

    for (const alias of character.aliases ?? []) {
      if (alias && alias.length >= 4) candidates.add(alias);
    }

    for (const candidate of candidates) {
      const key = candidate.toLowerCase();
      if (!idByPhrase.has(key)) {
        idByPhrase.set(key, character.id);
      }
    }
  }

  const phrases = Array.from(idByPhrase.keys()).sort(
    (a, b) => b.length - a.length
  );

  if (phrases.length === 0) {
    cache = { regex: null, idByPhrase };
    return cache;
  }

  const alternation = phrases.map(escapeRegExp).join("|");
  const regex = new RegExp(`\\b(${alternation})\\b`, "gi");

  cache = { regex, idByPhrase };
  return cache;
}

/**
 * Scans a paragraph of chapter text and wraps every recognized character
 * name, nickname, or alias in a link to that character's page. Plain text
 * segments are returned untouched. Safe to call on the server (no client
 * hooks are used).
 */
export function linkifyCharacterNames(text: string): ReactNode[] {
  const { regex, idByPhrase } = buildPatternCache();

  if (!regex) return [text];

  const segments = text.split(regex);

  return segments.map((segment, index) => {
    const id = idByPhrase.get(segment.toLowerCase());

    if (!id) return segment;

    return (
      <Link
        key={`${id}-${index}`}
        href={`/characters/${id}`}
        className={styles.characterLink}
      >
        {segment}
      </Link>
    );
  });
}
