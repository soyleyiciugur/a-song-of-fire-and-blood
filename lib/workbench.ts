import type { Character } from "@/types/character";

export type WorldDate = { day: number; moon: number; year: number };
export const DAYS_PER_MOON = 30;
export const MOONS_PER_YEAR = 12;
export const toWorldDay = ({ day, moon, year }: WorldDate) => year * 360 + (moon - 1) * 30 + day - 1;
export function fromWorldDay(value: number): WorldDate {
  const safe = Math.floor(value);
  const year = Math.floor(safe / 360);
  const withinYear = safe - year * 360;
  return { year, moon: Math.floor(withinYear / 30) + 1, day: withinYear % 30 + 1 };
}
export const formatWorldDate = (d: WorldDate) => `${ordinal(d.day)} day of the ${ordinal(d.moon)} moon, ${Math.abs(d.year)} ${d.year < 0 ? "BC" : "AC"}`;
export const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th"}`;

const knownId = (value?: string) => Boolean(value && value !== "-" && !value.includes(" "));
export function findKinship(characters: Character[], fromId: string, toId: string) {
  const byId = new Map(characters.map((c) => [c.id, c]));
  const graph = new Map<string, Array<{ id: string; relation: string }>>();
  const add = (a: string, b: string, relation: string) => graph.set(a, [...(graph.get(a) ?? []), { id: b, relation }]);
  for (const c of characters) {
    if (knownId(c.father) && byId.has(c.father as Character["id"])) { add(c.id, c.father, "father"); add(c.father, c.id, "child"); }
    if (knownId(c.mother) && byId.has(c.mother as Character["id"])) { add(c.id, c.mother, "mother"); add(c.mother, c.id, "child"); }
    for (const spouse of typeof c.spouse === "string" ? [c.spouse] : c.spouse ?? []) if (byId.has(spouse as Character["id"])) add(c.id, spouse, "spouse");
    for (const sibling of c.siblings ?? []) if (byId.has(sibling as Character["id"])) { add(c.id, sibling, "sibling"); add(sibling, c.id, "sibling"); }
  }
  const queue = [{ id: fromId, steps: [] as Array<{ id: string; relation: string }> }];
  const seen = new Set([fromId]);
  while (queue.length) {
    const current = queue.shift()!;
    if (current.id === toId) return describeKinship(current.steps, byId, fromId);
    for (const edge of graph.get(current.id) ?? []) if (!seen.has(edge.id) && current.steps.length < 8) { seen.add(edge.id); queue.push({ id: edge.id, steps: [...current.steps, edge] }); }
  }
  return null;
}

function describeKinship(steps: Array<{ id: string; relation: string }>, byId: Map<string, Character>, fromId: string) {
  const rels = steps.map((s) => s.relation);
  const isUp = (r: string) => r === "father" || r === "mother";
  let up = 0; while (up < rels.length && isUp(rels[up])) up += 1;
  const down = rels.length - up;
  const throughAncestor = rels.slice(up).every((r) => r === "child");
  const target = byId.get(steps.at(-1)?.id ?? fromId);
  const targetFemale = /\b(queen|princess|lady|septa|mother)\b/i.test(target?.title ?? "");
  let label = "Family connection";
  if (!steps.length) label = "Same person";
  else if (rels.length === 1) label = rels[0] === "child" ? "Parent and child" : rels[0] === "spouse" ? "Spouses" : "Child and parent";
  else if (rels.every((r) => r === "father" || r === "mother")) label = rels.length === 2 ? "Grandchild and grandparent" : `${rels.length - 1}× great-grandchild and ancestor`;
  else if (rels.every((r) => r === "child")) label = rels.length === 2 ? "Grandparent and grandchild" : `Ancestor and ${rels.length - 1}× great-grandchild`;
  else if (rels.length === 2 && ["father", "mother"].includes(rels[0]) && rels[1] === "child") label = "Siblings";
  else if (rels.at(-1) === "sibling" && rels.slice(0, -1).every(isUp)) label = `${"Great-".repeat(Math.max(0, rels.length - 2))}${targetFemale ? "aunt" : "uncle"}`;
  else if (rels[0] === "sibling" && rels.slice(1).every((r) => r === "child")) label = rels.length === 2 ? "Niece/nephew" : `${"Great-".repeat(rels.length - 2)}niece/nephew`;
  else if (throughAncestor && up === 2 && down === 1) label = "Niece/nephew and aunt/uncle";
  else if (throughAncestor && up === 1 && down === 2) label = "Aunt/uncle and niece/nephew";
  else if (throughAncestor && up >= 2 && down >= 2) {
    const degree = Math.min(up, down) - 1;
    const removed = Math.abs(up - down);
    label = `${ordinalWord(degree)} cousins${removed ? `, ${removed} time${removed === 1 ? "" : "s"} removed` : ""}`;
  }
  const ids = [fromId, ...steps.map((s) => s.id)];
  return { label, path: ids.map((id) => ({ id, name: byId.get(id)?.name ?? id })) };
}

const ordinalWord = (n: number) => n === 1 ? "First" : n === 2 ? "Second" : n === 3 ? "Third" : `${n}th`;

export type NameEntity = "personal" | "house" | "place" | "ship" | "dragon" | "inn" | "epithet";
const lexicon: Record<string, { a: string[]; b: string[] }> = {
  north: { a: ["Grey", "Cold", "Winter", "Wolf", "Pine", "Flint"], b: ["watch", "wood", "hall", "mere", "ford", "keep"] },
  riverlands: { a: ["River", "Willow", "Red", "Reed", "Mill", "Trident"], b: ["run", "cross", "ford", "field", "bank", "water"] },
  vale: { a: ["High", "Falcon", "Sky", "Stone", "Cloud", "Moon"], b: ["rest", "gate", "perch", "mont", "watch", "spire"] },
  reach: { a: ["Rose", "Green", "Gold", "Apple", "Honey", "Vine"], b: ["bury", "garden", "field", "hall", "meadow", "grove"] },
  stormlands: { a: ["Storm", "Rain", "Thunder", "Gale", "Stag", "Black"], b: ["watch", "break", "cliff", "wood", "haven", "march"] },
  westerlands: { a: ["Gold", "Lion", "Deep", "Red", "Copper", "Bright"], b: ["rock", "mine", "hall", "tooth", "crag", "fort"] },
  crownlands: { a: ["Crown", "Black", "Harbor", "King", "Dragon", "Rosby"], b: ["gate", "water", "watch", "rest", "port", "hill"] },
  dorne: { a: ["Sun", "Sand", "Red", "Spear", "Dusk", "Salt"], b: ["spire", "well", "stone", "rest", "garden", "shore"] },
  ironislands: { a: ["Iron", "Salt", "Black", "Drowned", "Grey", "Wave"], b: ["keel", "reef", "pyke", "wake", "holm", "rock"] },
  valyrian: { a: ["Vhael", "Aery", "Rhae", "Daem", "Zal", "Belaer"], b: ["ion", "yra", "ax", "or", "erys", "agon"] },
};
const tones: Record<string, string[]> = {
  noble: ["Golden", "Proud", "Radiant", "High", "Crowned", "Gallant"], grim: ["Black", "Bleak", "Broken", "Last", "Ashen", "Dread"],
  rustic: ["Muddy", "Old", "Crooked", "Laughing", "Sleepy", "Merry"], martial: ["Iron", "Bold", "Bloody", "Red", "War", "Spear"],
  mocking: ["Limp", "Little", "Ale-soaked", "Goat-kissed", "Half-a", "Turncloak"], mysterious: ["Pale", "Veiled", "Whispering", "Moonlit", "Silent", "Starless"],
};
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
export function generateEntityName(entity: NameEntity, culture: string, tone: string, subtype: string, personal?: { given: string; surname?: string }) {
  const bank = lexicon[culture] ?? lexicon.north; const mood = tones[tone] ?? tones.noble; const a = pick(bank.a); const b = pick(bank.b);
  if (entity === "personal" && personal) return [personal.given, personal.surname].filter(Boolean).join(" ");
  if (entity === "house") return `House ${a}${b}`;
  if (entity === "place") return subtype === "island" ? `${a} Isle` : subtype === "castle" ? `${a}${b} Keep` : `${a}${b}`;
  if (entity === "ship") return `The ${pick(mood)} ${pick(["Maiden", "Gull", "Stag", "Wolf", "Fortune", "Daughter"])}`;
  if (entity === "dragon") return subtype === "common" ? `${pick(mood)}${pick(["wing", "flame", "fyre", "maw", "scale"])}` : `${a}${b}`;
  if (entity === "inn") return `${pick(["The", "Ye Olde"])} ${pick(mood)} ${pick(["Dragon", "Stag", "Cup", "Lantern", "Goose", "Sow"])}`;
  return tone === "mocking" ? `${pick(["the", "called the"])} ${pick(mood)} ${pick(["Fool", "Goat", "Boot", "Lion", "Crow"])}` : `the ${pick(mood)}${subtype === "popular" ? " One" : ""}`;
}
