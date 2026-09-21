import comparisonData from "./dragon-size-comparison.json";

export type DragonSizeRecord = (typeof comparisonData.dragons)[number];
export type DragonSizeMode = "overlay" | "rows";

export const dragonSizeComparison = comparisonData;
export const dragonSizeRecords = comparisonData.dragons;
export const dragonSizeIds = new Set(dragonSizeRecords.map((dragon) => dragon.id));

export function getDragonSizeRecord(id: string) {
  return dragonSizeRecords.find((dragon) => dragon.id === id);
}
