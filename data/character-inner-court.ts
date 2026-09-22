export type InnerCourtKind =
  | "thought"
  | "suspicion"
  | "preference"
  | "belief"
  | "theory"
  | "question";

export type InnerCourtEntry = {
  id: string;
  chapterSlug: string;
  kind: InnerCourtKind;
  subject?: string;
  body: string;
  status: "active" | "changed" | "resolved";
  supersedes?: string;
  createdAt?: string;
  updatedAt?: string;
  sortOrder?: number;
};

export type PlayedCharacterAssignment = {
  characterId: string;
  playerUsername: string;
  /** Omit until a matching public member profile exists. */
  playerProfileHref?: string;
};

export const playedCharacterAssignments: PlayedCharacterAssignment[] = [
  { characterId: "jacaelon-targaryen", playerUsername: "luck", playerProfileHref: "/users/luck" },
  { characterId: "visenor-targaryen", playerUsername: "ubeka", playerProfileHref: "/users/ubeka" },
  { characterId: "gaelor-targaryen", playerUsername: "tay" },
  { characterId: "hrrm", playerUsername: "hrrm", playerProfileHref: "/users/hrrm" },
];

export const innerCourtEntries: Record<string, InnerCourtEntry[]> = {
  "jacaelon-targaryen": [
    {
      id: "jace-handwriting-doubt",
      chapterSlug: "the-price-of-trust",
      kind: "suspicion",
      subject: "The Hand",
      body: "The bank records do not match Derrin Hightower's hand. Suspicion is not proof, and someone may be arranging the evidence to point toward him.",
      status: "active",
    },
    {
      id: "jace-warnings-proven",
      chapterSlug: "judgment-by-blood",
      kind: "belief",
      subject: "The Crown",
      body: "Every crisis has made caution look less like fear and more like foresight. The realm will need a hand willing to see danger before the rest of the court names it.",
      status: "active",
    },
  ],
  "visenor-targaryen": [
    {
      id: "visenor-family-doubt",
      chapterSlug: "the-poison-beneath-the-crown",
      kind: "question",
      subject: "His siblings",
      body: "If poison can reach the king's own table, which bonds within the royal family can still be trusted without reservation?",
      status: "active",
    },
    {
      id: "visenor-starfall-fear",
      chapterSlug: "judgment-by-blood",
      kind: "suspicion",
      subject: "Starfall",
      body: "The report of burned men and a loose dragon points toward Boneskin. If the dragon has left the mountains, Rhaella may be caught in whatever happened there.",
      status: "active",
    },
  ],
  "gaelor-targaryen": [
    {
      id: "gaelor-dead-witness",
      chapterSlug: "the-poison-beneath-the-crown",
      kind: "question",
      subject: "The assassin",
      body: "The dying man's accusation named the Hand, but killing him ended any chance to learn whether it was truth, a lie, or bait.",
      status: "active",
    },
    {
      id: "gaelor-stepstones",
      chapterSlug: "judgment-by-blood",
      kind: "theory",
      subject: "The Stepstones",
      body: "A victory in the Stepstones, won with Braavosi support, could restore the authority and honour expected of an heir more decisively than another season at court.",
      status: "active",
    },
  ],
};

export function getPlayedCharacterAssignment(characterId: string) {
  return playedCharacterAssignments.find((assignment) => assignment.characterId === characterId);
}

export function getInnerCourtEntries(characterId: string) {
  return innerCourtEntries[characterId] ?? [];
}
