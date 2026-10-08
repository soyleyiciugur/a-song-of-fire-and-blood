export type GreatGameEmoteId =
  | "wow"
  | "oops"
  | "threaten"
  | "thanks"
  | "greetings"
  | "well-played"
  | "salt";

export type GreatGameEmoteDefinition = {
  id: GreatGameEmoteId;
  label: string;
  ariaLabel: string;
  maraText: string;
  aldrenText: string;
  maraSentText: string;
  aldrenSentText: string;
};

export const GREAT_GAME_EMOTE_PREFIX = "[[great-game-emote:";
export const GREAT_GAME_INNKEEPER_ACTION_EVENT = "great-game-innkeeper-action";

export const GREAT_GAME_EMOTES: readonly GreatGameEmoteDefinition[] = [
  {
    id: "wow",
    maraSentText: "Told them you're impressed. Try to look less surprised.",
    aldrenSentText: "I have conveyed your admiration, my liege.",
    label: "WOW",
    ariaLabel: "Wow",
    maraText: "Apparently that impressed them. Try not to let it go to your head.",
    aldrenText: "You have quite impressed your opponent, my liege.",
  },
  {
    id: "oops",
    maraSentText: "Told them you slipped. They probably noticed.",
    aldrenSentText: "I have offered your apologies for the mishap, my liege.",
    label: "OOPS",
    ariaLabel: "Oops",
    maraText: 'That was an "oops." Useful information, I\'m sure.',
    aldrenText: "A small mishap across the table, my liege. How unfortunate.",
  },
  {
    id: "threaten",
    maraSentText: "Your threat's delivered. Now you have to back it up.",
    aldrenSentText: "Your challenge has been issued, my liege. May they heed it.",
    label: "THREATEN",
    ariaLabel: "Threaten",
    maraText: "They're threatening you. You look devastated.",
    aldrenText: "A challenge to your majesty! I trust you shall answer splendidly.",
  },
  {
    id: "thanks",
    maraSentText: "Passed on your thanks. Don't make a habit of being polite.",
    aldrenSentText: "I have conveyed your gratitude, my liege.",
    label: "THANKS",
    ariaLabel: "Thanks",
    maraText: "They said thanks. Manners. How novel.",
    aldrenText: "Your opponent offers their thanks, my liege. Most gracious.",
  },
  {
    id: "greetings",
    maraSentText: "Said hello for you. There, introductions done.",
    aldrenSentText: "I have conveyed your greetings, my liege.",
    label: "GREETINGS",
    ariaLabel: "Greetings",
    maraText: "The other guy is saying hi. Or girl. I don't know.",
    aldrenText: "Your opponent sends their greetings, my liege. A fine evening for a game.",
  },
  {
    id: "well-played",
    maraSentText: "Told them they played well. Generous of you.",
    aldrenSentText: "Your compliments on their fine play have been conveyed, my liege.",
    label: "WELL PLAYED",
    ariaLabel: "Well played",
    maraText: "They say well played. Enjoy the praise while it lasts.",
    aldrenText: "Well played, they say! Your skill commands admiration, my liege.",
  },
  {
    id: "salt",
    maraSentText: "Sent the salt. They've earned the whole shaker.",
    aldrenSentText: "Your pinch of salt has reached the other side, my liege.",
    aldrenText: "A little salt from across the table, my liege. Shall I fetch the ale?",
    label: "🧂",
    ariaLabel: "Salt",
    maraText: "🧂",
  },
] as const;

const EMOTE_IDS = new Set<GreatGameEmoteId>(GREAT_GAME_EMOTES.map((emote) => emote.id));

export function encodeGreatGameEmote(id: GreatGameEmoteId): string {
  return `${GREAT_GAME_EMOTE_PREFIX}${id}]]`;
}

export function decodeGreatGameEmote(body: string): GreatGameEmoteId | null {
  if (!body.startsWith(GREAT_GAME_EMOTE_PREFIX) || !body.endsWith("]]")) return null;
  const id = body.slice(GREAT_GAME_EMOTE_PREFIX.length, -2) as GreatGameEmoteId;
  return EMOTE_IDS.has(id) ? id : null;
}

export function greatGameEmoteDefinition(id: GreatGameEmoteId): GreatGameEmoteDefinition {
  return GREAT_GAME_EMOTES.find((emote) => emote.id === id) ?? GREAT_GAME_EMOTES[0];
}

export function greatGameEmoteCopy(id: GreatGameEmoteId, supporter: "mara" | "aldren", sent = false): string {
  const definition = greatGameEmoteDefinition(id);
  if (sent) return supporter === "mara"
    ? definition.maraSentText
    : definition.aldrenSentText;
  if (supporter === "aldren") return definition.aldrenText;
  return id === "salt" ? "Salt from the other side. As if the ale needed seasoning." : definition.maraText;
}
