export type TableSpeakerId = "mara" | "aldren";

/** Shared by prompts and turn notices for the current browser session. */
export function createTableSpeakerPicker() {
  let previous: TableSpeakerId | null = null;
  let streak = 0;
  return (random = Math.random): TableSpeakerId => {
    const switchChance = Math.min(1, 0.5 + streak * 0.15);
    const speaker = previous === null
      ? (random() < 0.5 ? "mara" : "aldren")
      : random() < switchChance
        ? (previous === "mara" ? "aldren" : "mara")
        : previous;
    streak = speaker === previous ? streak + 1 : 1;
    previous = speaker;
    return speaker;
  };
}

export const pickTableSpeaker = createTableSpeakerPicker();
