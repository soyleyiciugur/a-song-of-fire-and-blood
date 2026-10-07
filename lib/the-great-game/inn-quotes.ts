import type { TableSpeakerId } from "./table-speaker";

export type InnQuoteKind = "welcome" | "win" | "loss" | "draw" | "empty";
export type InnQuote = { speaker: TableSpeakerId; text: string };
export const INN_QUOTES: Record<InnQuoteKind, Record<TableSpeakerId, readonly string[]>> = {
  welcome: {
    mara: ["A familiar rival. A fresh deck. Take a seat. I'll tend the fire.", "The table is clear. Try to keep the ale off your cards.", "Bring a friend. Leave the crown at the door.", "One more game? Thought so. Your seat is still warm."],
    aldren: ["Your table awaits, my liege. Shall I send for a worthy rival?", "A fine evening for a little ambition, Your Grace. The cards are ready.", "Welcome back, my liege. A warm hearth and a willing opponent improve any evening.", "Take your ease, Your Grace. We shall settle the fate of the realm after the first cup."],
  },
  win: {
    mara: ["Well played. Keep a seat for the next challenger.", "A clean win. Try not to grin into your cup.", "You earned that one. Give your rival a moment.", "Another tale for the table. I'll remember who actually won."],
    aldren: ["A fine victory, my liege. Shall I reserve the table for another?", "Your rival has given us a most gracious evening, Your Grace.", "The ledger records a victory. The inn will remember the manner of it.", "Well played, my liege. A modest toast would not be out of place."],
  },
  loss: {
    mara: ["A hard table. Catch your breath. There's another game in you.", "The cards are cleared. The seat is still yours.", "Lost the game, not the evening. Another cup?"],
    aldren: ["The table will welcome you again, my liege.", "A difficult hand, Your Grace. Even the finest ruler has another lesson to learn.", "Let us call that experience, my liege. The next table remains unwritten."],
  },
  draw: {
    mara: ["Even, then. Someone still has to pay for the ale.", "Neither of you would yield. I can respect that."],
    aldren: ["An equal reckoning, my liege. Perhaps the next hand will settle it.", "The realm has declined to choose a favourite this evening, Your Grace."],
  },
  empty: {
    mara: ["No tales in the ledger yet. Take a seat and change that.", "A clean table. A blank ledger. Your move."],
    aldren: ["The ledger awaits your first tale, my liege.", "There is room for a new name in our history, Your Grace."],
  },
};

export function chooseInnQuote(kind: InnQuoteKind, speaker: TableSpeakerId, random = Math.random): InnQuote {
  const lines = INN_QUOTES[kind][speaker];
  return { speaker, text: lines[Math.min(lines.length - 1, Math.floor(random() * lines.length))] };
}
