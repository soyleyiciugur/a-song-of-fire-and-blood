import { getCharacters } from "@/lib/characters";
import type { Character } from "@/types/character";

const KING_ID = "baelenys-targaryen";
const RENOUNCED_IDS = new Set(["malaenar-targaryen"]);

function isFemale(character: Character) {
  return /princess|queen|lady|daughter/i.test(`${character.title} ${character.name}`);
}

function birthKey(character: Character) {
  return character.nameday
    ? character.nameday.year * 360 + character.nameday.moon * 30 + character.nameday.day
    : Number.MAX_SAFE_INTEGER;
}

function orderMembers(members: Character[]) {
  return [...members].sort((a, b) => Number(isFemale(a)) - Number(isFemale(b)) || birthKey(a) - birthKey(b));
}

function appearsBastard(character: Character) {
  const text = `${character.title} ${character.summary}`;
  return /\bbastard\b/i.test(text) && !/legitimized|legitimate/i.test(text);
}

export type SuccessionEntry = {
  rank: number;
  character: Character;
  branch: string;
  reason: string;
};

/**
 * Produces a representation-based, male-preference succession order from the
 * family graph. A branch is exhausted before the next sibling is considered;
 * when the direct line ends, the same rule is applied to the king's siblings
 * and then to the next collateral generation.
 */
export function getSuccessionLine(): SuccessionEntry[] {
  const characters = getCharacters().filter((character) => !character.hidden);
  const byId = new Map(characters.map((character) => [character.id, character]));
  const king = byId.get(KING_ID);
  if (!king) return [];

  const childrenOf = (parentId: string) => orderMembers(
    characters.filter((character) => character.father === parentId || character.mother === parentId)
  );

  const siblingsOf = (character: Character) => {
    const listed = new Set(character.siblings ?? []);
    return orderMembers(characters.filter((candidate) => {
      if (candidate.id === character.id) return false;
      if (listed.has(candidate.id)) return true;
      const sharesFather = candidate.father !== "-" && candidate.father === character.father;
      const sharesMother = candidate.mother !== "-" && candidate.mother === character.mother;
      return sharesFather || sharesMother;
    }));
  };

  const result: SuccessionEntry[] = [];
  const visited = new Set<string>();

  const addBranch = (character: Character, branch: string, reason: string) => {
    if (visited.has(character.id) || RENOUNCED_IDS.has(character.id) || character.id === KING_ID) return;
    visited.add(character.id);

    if (!appearsBastard(character) && character.status !== "Dead") {
      result.push({ rank: result.length + 1, character, branch, reason });
    }

    childrenOf(character.id).forEach((child) => {
      addBranch(child, character.name, `Issue of ${character.name}`);
    });
  };

  childrenOf(king.id).forEach((child) => {
    addBranch(child, "Direct issue", "Direct issue of the King");
  });

  // Walk the nearest collateral generation first. Each sibling's entire line
  // is consumed before moving to the next sibling, matching representation.
  const collateralQueue = siblingsOf(king);
  const queued = new Set<string>([KING_ID]);
  collateralQueue.forEach((sibling) => {
    if (!queued.has(sibling.id)) {
      queued.add(sibling.id);
      addBranch(sibling, "Collateral line", `Collateral line of ${king.name}`);
    }
  });

  // If a family dataset has no explicit sibling arrays, climb the father's
  // line as a final fallback: uncles, their issue, then more distant branches.
  let ancestor = byId.get(king.father as Character["id"]);
  while (ancestor) {
    siblingsOf(ancestor).forEach((relative) => {
      if (!queued.has(relative.id)) {
        queued.add(relative.id);
        addBranch(relative, "Distant collateral", `Collateral line of ${ancestor?.name ?? "the royal ancestor"}`);
      }
    });
    ancestor = byId.get(ancestor.father as Character["id"]);
  }

  return result;
}
