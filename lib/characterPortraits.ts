import fs from "node:fs";
import path from "node:path";
import type { CharacterAgeState } from "./age";
import { CHARACTER_AGE_STATES } from "./age";

const PORTRAIT_EXTENSIONS = ["webp", "png", "jpg", "jpeg"] as const;

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
