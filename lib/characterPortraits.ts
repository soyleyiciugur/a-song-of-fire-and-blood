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
 * The root character portrait is always the canonical worldDate/current image.
 * The age-state matching the current character age therefore points at root;
 * every other state is looked up in its own subfolder.
 */
export function getCharacterPortraitVariants(
  characterId: string,
  currentAgeState: CharacterAgeState,
  customCurrentPortrait?: string | null
): CharacterPortraitVariants {
  const variants: CharacterPortraitVariants = {};

  const currentPortrait =
    customCurrentPortrait ??
    findPublicImage(`images/characters/${characterId}`);

  if (currentPortrait) {
    variants[currentAgeState] = currentPortrait;
  }

  for (const state of CHARACTER_AGE_STATES) {
    if (state === currentAgeState) continue;

    const portrait = findPublicImage(
      `images/characters/${state}/${characterId}-${state}`
    );

    if (portrait) variants[state] = portrait;
  }

  return variants;
}
