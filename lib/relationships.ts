import charactersData from "@/data/characters/characters.json";
import { dragons, type Dragon } from "@/data/dragons";
import type { Character, CharacterId } from "@/types/character";

export type EffectiveRelationship = {
  id: string;
  name: string;
  description: string;
  kind: "character" | "dragon";
  character?: Character;
  dragon?: Dragon;
};

const allCharacters = charactersData as Character[];
const publicCharacters = allCharacters.filter((character) => !character.hidden);
const byId = new Map<CharacterId, Character>(
  publicCharacters.map((character) => [character.id, character])
);
const dragonsByName = new Map(
  dragons.map((dragon) => [dragon.name.toLocaleLowerCase("en"), dragon])
);

function displayNameFromId(id: string) {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1))
    .join(" ");
}

export function sortableCharacterName(name: string) {
  return name
    .replace(/^(Ser|Lady|Lord|King|Queen|Prince|Princess|Mother)\s+/i, "")
    .trim();
}

/**
 * Relationship lore lives only in characters.json.
 *
 * Every character-to-character bond is written explicitly from both
 * characters' perspectives. This helper does not invent reverse text,
 * infer family descriptions, or contain chapter-specific hardcoded bonds.
 *
 * Its only jobs are:
 * - resolve relationship ids to public character records,
 * - keep explicit unresolved records visible,
 * - hide relationships pointing at hidden characters,
 * - sort the resulting list A-Z by character name.
 */
export function getEffectiveRelationships(
  characterId: CharacterId
): EffectiveRelationship[] {
  const character = byId.get(characterId);
  if (!character) return [];

  const characterRelationships = Object.entries(character.relationships ?? {})
    .flatMap(([id, description]) => {
      const resolved = byId.get(id as CharacterId);

      // If this id exists in characters.json but is hidden, omit it entirely.
      const rawCharacter = allCharacters.find((entry) => entry.id === id);
      if (rawCharacter?.hidden) return [];

      return [
        {
          id,
          name: resolved?.name ?? displayNameFromId(id),
          description,
          kind: "character" as const,
          character: resolved,
        },
      ];
    })
    .sort((a, b) =>
      sortableCharacterName(a.name).localeCompare(
        sortableCharacterName(b.name),
        "en",
        { sensitivity: "base" }
      )
    );

  const bondedDragon = character.dragon
    ? dragonsByName.get(character.dragon.toLocaleLowerCase("en"))
    : undefined;

  if (!bondedDragon || bondedDragon.riderId !== character.id) {
    return characterRelationships;
  }

  return [
    ...characterRelationships,
    {
      id: bondedDragon.id,
      name: bondedDragon.name,
      description: bondedDragon.description,
      kind: "dragon" as const,
      dragon: bondedDragon,
    },
  ].sort((a, b) =>
    sortableCharacterName(a.name).localeCompare(
      sortableCharacterName(b.name),
      "en",
      { sensitivity: "base" }
    )
  );
}
