import fs from "node:fs";
import path from "node:path";
import type { CharacterAgeState } from "./age";
import { CHARACTER_AGE_STATES } from "./age";

const PORTRAIT_EXTENSIONS = ["webp", "png", "jpg", "jpeg", "avif", "gif"] as const;

export type CharacterPortraitVariants = Partial<
  Record<CharacterAgeState, string>
>;

function findPublicImage(relativeWithoutExtension: string): string | null {
  for (const extension of PORTRAIT_EXTENSIONS) {
    const relativePath = `${relativeWithoutExtension}.${extension}`;
    const absolutePath = path.join(process.cwd(), "public", relativePath);

    if (fs.existsSync(absolutePath)) {
      return `/${relativePath.replaceAll(path.sep, "/")}`;
    }
  }

  return null;
}

/**
 * Every portrait state lives in its own age-state folder.
 * There is no special root/current portrait anymore.
 *
 * Example:
 *   /images/characters/young/jacaelon-targaryen-young.webp
 *   /images/characters/adult/jacaelon-targaryen-adult.webp
 */
export function getCharacterPortraitVariants(
  characterId: string
): CharacterPortraitVariants {
  const variants: CharacterPortraitVariants = {};

  for (const state of CHARACTER_AGE_STATES) {
    const portrait = findPublicImage(
      `images/characters/${state}/${characterId}-${state}`
    );

    if (portrait) {
      variants[state] = portrait;
    }
  }

  return variants;
}

/**
 * Resolve the portrait state that can actually be rendered.
 *
 * Characters do not necessarily have artwork for every age bucket. Never let
 * the UI fall through to a hard-coded `adult` portrait (or an empty image)
 * just because the age-derived bucket is missing. Prefer the requested state,
 * then the nearest available age bucket; ties prefer the older state so a
 * character never visually regresses when crossing an age boundary.
 */
export function resolveAvailablePortraitState(
  requestedState: CharacterAgeState,
  variants: CharacterPortraitVariants
): CharacterAgeState {
  if (variants[requestedState]) return requestedState;

  const requestedIndex = CHARACTER_AGE_STATES.indexOf(requestedState);
  const available = CHARACTER_AGE_STATES.filter((state) => Boolean(variants[state]));

  if (available.length === 0) return requestedState;

  return available.reduce((best, state) => {
    const stateIndex = CHARACTER_AGE_STATES.indexOf(state);
    const bestIndex = CHARACTER_AGE_STATES.indexOf(best);
    const distance = Math.abs(stateIndex - requestedIndex);
    const bestDistance = Math.abs(bestIndex - requestedIndex);

    if (distance < bestDistance) return state;
    if (distance === bestDistance && stateIndex > bestIndex) return state;
    return best;
  });
}
