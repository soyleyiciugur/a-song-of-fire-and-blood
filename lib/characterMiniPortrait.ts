import charactersData from "@/data/characters/characters.json";
import housesData from "@/data/houses.json";

type CharacterHouseRow = {
  id: string;
  house?: string;
};

type HouseSigilRow = {
  id: string;
  name: string;
  sigilSrc?: string;
};

const CHARACTER_HOUSES = new Map(
  (charactersData as CharacterHouseRow[]).map((character) => [
    character.id,
    character.house?.trim() ?? "",
  ]),
);

const HOUSE_SIGILS = new Map<string, string>();

for (const house of housesData as HouseSigilRow[]) {
  if (!house.sigilSrc) continue;

  HOUSE_SIGILS.set(house.id.toLocaleLowerCase(), house.sigilSrc);
  HOUSE_SIGILS.set(house.name.toLocaleLowerCase(), house.sigilSrc);
  HOUSE_SIGILS.set(
    house.name.replace(/^House\s+/i, "").trim().toLocaleLowerCase(),
    house.sigilSrc,
  );
}

export function getCharacterHouseSigil(characterId?: string | null) {
  if (!characterId) return null;

  const house = CHARACTER_HOUSES.get(characterId);
  if (!house || house === "-") return null;

  const normalized = house.replace(/^House\s+/i, "").trim().toLocaleLowerCase();

  return (
    HOUSE_SIGILS.get(house.toLocaleLowerCase()) ??
    HOUSE_SIGILS.get(normalized) ??
    null
  );
}
