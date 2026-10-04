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
};

export const GREAT_GAME_EMOTE_PREFIX = "[[great-game-emote:";
export const GREAT_GAME_INNKEEPER_ACTION_EVENT = "great-game-innkeeper-action";

export const GREAT_GAME_EMOTES: readonly GreatGameEmoteDefinition[] = [
  {
    id: "wow",
    label: "WOW",
    ariaLabel: "Wow",
    maraText: "Apparently that impressed them. Try not to let it go to your head.",
  },
  {
    id: "oops",
    label: "OOPS",
    ariaLabel: "Oops",
    maraText: 'That was an "oops." Useful information, I\'m sure.',
  },
  {
    id: "threaten",
    label: "THREATEN",
    ariaLabel: "Threaten",
    maraText: "They're threatening you. You look devastated.",
  },
  {
    id: "thanks",
    label: "THANKS",
    ariaLabel: "Thanks",
    maraText: "They said thanks. Manners. How novel.",
  },
  {
    id: "greetings",
    label: "GREETINGS",
    ariaLabel: "Greetings",
    maraText: "The other guy is saying hi. Or girl. I don't know.",
  },
  {
    id: "well-played",
    label: "WELL PLAYED",
    ariaLabel: "Well played",
    maraText: "They say well played. Enjoy the praise while it lasts.",
  },
  {
    id: "salt",
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
