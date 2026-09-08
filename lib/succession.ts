import { getCharacters } from "@/lib/characters";
import type { Character } from "@/types/character";

const KING_ID = "baelenys-targaryen";
const RENOUNCED_IDS = new Set(["malaenar-targaryen"]);
function isFemale(character: Character) { return /princess|queen|lady|daughter/i.test(`${character.title} ${character.name}`); }
function birthKey(character: Character) { return character.nameday ? character.nameday.year * 360 + character.nameday.moon * 30 + character.nameday.day : Number.MAX_SAFE_INTEGER; }
function orderMembers(members: Character[]) { return [...members].sort((a, b) => Number(isFemale(a)) - Number(isFemale(b)) || birthKey(a) - birthKey(b)); }
export type SuccessionEntry = { rank: number; character: Character; branch: string; reason: string };
export function getSuccessionLine(): SuccessionEntry[] { const characters = getCharacters().filter((character) => !character.hidden); const childrenOf = (parentId: string) => orderMembers(characters.filter((character) => character.father === parentId || character.mother === parentId)); const result: SuccessionEntry[] = []; const visited = new Set<string>(); const walk = (character: Character, branch: string) => { if (visited.has(character.id) || RENOUNCED_IDS.has(character.id) || character.id === KING_ID) return; visited.add(character.id); result.push({ rank: result.length + 1, character, branch, reason: branch === "Direct issue" ? "Direct line of the King" : `Issue of ${branch}` }); childrenOf(character.id).forEach((child) => walk(child, character.name)); }; childrenOf(KING_ID).forEach((child) => walk(child, "Direct issue")); return result; }
