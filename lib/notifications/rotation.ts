import type { NotificationMascot, NotificationPreferences } from "./types";

function weightedPick(items: Array<[NotificationMascot, number]>) {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [item, weight] of items) {
    roll -= weight;
    if (roll <= 0) return item;
  }
  return items.at(-1)?.[0] ?? "mara";
}

/**
 * Balanced mode is deliberately random, but has a catch-up mechanic:
 * the mascot who has appeared less often gains weight, and a repeated mascot
 * makes the other one increasingly likely. A third identical delivery in a
 * row is prevented outright so the pair never feels stuck on one speaker.
 */
export function chooseMascot(preferences: Pick<NotificationPreferences, "last_mascot" | "mascot_streak" | "mara_count" | "aldren_count">): NotificationMascot {
  const last = preferences.last_mascot;
  if (last && preferences.mascot_streak >= 2) return last === "mara" ? "aldren" : "mara";

  let maraWeight = 1;
  let aldrenWeight = 1;
  const balance = preferences.mara_count - preferences.aldren_count;
  if (balance > 0) aldrenWeight += Math.min(4, balance * .8);
  if (balance < 0) maraWeight += Math.min(4, -balance * .8);
  if (last === "mara") aldrenWeight += 2.5 + preferences.mascot_streak * 1.5;
  if (last === "aldren") maraWeight += 2.5 + preferences.mascot_streak * 1.5;
  return weightedPick([["mara", maraWeight], ["aldren", aldrenWeight]]);
}

