import { getAllGameCards } from "@/lib/the-great-game/cards";
import { getCharacter } from "@/lib/characters";
import fs from "node:fs";
import path from "node:path";
import { resolveAvailablePortraitState, type CharacterPortraitVariants } from "@/lib/characterPortraits";
import { CHARACTER_AGE_STATES, computeAge, resolvePortraitAgeState } from "@/lib/age";
import worldDate from "@/data/worldDate.json";

export const dynamic = "force-static";

export function GET() {
  // Discover once per directory, not thousands of individual filesystem probes.
  const root = path.join(process.cwd(), "public/images/characters");
  const files = new Set<string>();
  for (const folder of ["", ...CHARACTER_AGE_STATES]) {
    try {
      for (const entry of fs.readdirSync(path.join(root, folder), { withFileTypes: true })) {
        if (entry.isFile()) files.add(folder ? `${folder}/${entry.name}` : entry.name);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  const find = (bases: string[]) => {
    for (const base of bases) for (const extension of ["webp", "png", "jpg", "jpeg", "avif", "gif"]) {
      const file = `${base}.${extension}`;
      if (files.has(file)) return `/images/characters/${file}`;
    }
  };
  const portraits: Record<string, string> = {};
  for (const card of getAllGameCards()) {
    if (card.cardType !== "character") continue;
    const id = card.linkedCharacterId ?? card.id;
    const character = getCharacter(id);
    const variants: CharacterPortraitVariants = {};
    for (const state of CHARACTER_AGE_STATES) {
      const source = find([`${state}/${id}-${state}`, `${id}-${state}`]);
      if (source) variants[state] = source;
    }
    const age = character?.age ?? (character?.nameday ? computeAge(character.nameday, worldDate, character.death) : undefined);
    const state = resolveAvailablePortraitState(resolvePortraitAgeState(age, character?.portraitAgeState), variants);
    const source = variants[state] ?? find([id]);
    if (source) portraits[id] = source;
  }
  return Response.json(portraits, { headers: { "Cache-Control": "no-store" } });
}
