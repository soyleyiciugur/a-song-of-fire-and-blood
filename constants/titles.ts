// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\constants\titles.ts
export const TITLE_ORDER = [
  "King of the Seven Kingdoms",
  "Queen of the Seven Kingdoms",
  "Crown Prince",
  "Prince",
  "Princess",
  "Hand of the King",
  "Lord Commander of the Kingsguard",
  "Master of Coin",
  "Grand Maester",
  "Maester",
  "Lord of Winterfell and Warden of the North",
  "Lord of Dragonstone",
  "Lord of Storm's End",
  "Lord of Torrentine",
  "Lord of Oldtown",
  "Sworn Brother of the Kingsguard",
  "Knight",
  "Lady",
  "Traitor",
];

export function getTitleRank(title: string): number {
  const lower = title.toLowerCase();

  const isFormer = lower.startsWith("former ");
  const isLate = lower.startsWith("late ");

  const cleanTitle = lower
    .replace(/^former\s+/, "")
    .replace(/^late\s+/, "");

  const rank = TITLE_ORDER.findIndex((t) =>
    cleanTitle.includes(t.toLowerCase())
  );

  const baseRank = rank === -1 ? Number.MAX_SAFE_INTEGER : rank;

  // Former/Late olanlar her zaman normal karakterlerden sonra gelir.
  return (isFormer || isLate)
    ? baseRank + TITLE_ORDER.length
    : baseRank;
}