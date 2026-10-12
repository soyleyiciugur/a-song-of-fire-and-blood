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
  characterIds?: string[];
  isPrivate?: boolean;
  hideFromGm?: boolean;
  surveyKey?: string;
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
  { characterId: "gaelor-targaryen", playerUsername: "taylan", playerProfileHref: "/users/taylan" },
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
  "visenor-targaryen": [],
  "gaelor-targaryen": [],
};

export function getPlayedCharacterAssignment(characterId: string) {
  return playedCharacterAssignments.find((assignment) => assignment.characterId === characterId);
}

export function getInnerCourtEntries(characterId: string) {
  return innerCourtEntries[characterId] ?? [];
}
