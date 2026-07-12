// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\types\character.ts
export type CharacterStatus = "Alive" | "Dead" | "Unknown" | "Missing";

export type CharacterId =
  | "alysanne-hightower"
  | "baelenys-targaryen"
  | "baelor-targaryen"
  | "brandon-stark"
  | "ser-brannyn-vance"
  | "cordin-poole"
  | "curtass-whent"
  | "darren-dayne"
  | "derrin-hightower"
  | "gaelor-targaryen"
  | "jacaelon-targaryen"
  | "jaery-targaryen"
  | "lorenah-dayne"
  | "maela-targaryen"
  | "malaenar-targaryen"
  | "naella-velaryon"
  | "ser-orwell-morrigen"
  | "rhaella-targaryen"
  | "rickard-stark"
  | "saera-targaryen"
  | "ser-alester-dayne"
  | "ser-brant-costayne"
  | "ser-saathos-maris"
  | "steffon-baratheon"
  | "timos-hightower"
  | "tion-lannister"
  | "vahaemon-targaryen"
  | "vhaemys-targaryen"
  | "visenor-targaryen";


export interface CharacterQuote {
  text: string;
  speakerId?: CharacterId | string;
  speakerName: string;
  chapterSlug?: string;
  chapterTitle?: string;
}

export interface CharacterNameday {
  day: number;
  moon: number;
  year: number;
}

export interface Character {
  id: CharacterId;

  name: string;
  nickname?: string;
  aliases: string[];

  house: string;
  title: string;

  status: CharacterStatus;
  secret?: { status: CharacterStatus; note: string };

  /** @deprecated legacy static age — superseded by `nameday` + computeAge(). Kept optional so old records don't break. */
  age?: number;
  nameday?: CharacterNameday;
  height?: string;

  father: string;
  mother: string;

  spouse?: string;

  siblings: string[];
  children?: string[];

  mentor?: string;
  dragon?: string;

  traits: string[];
  goals: string[];

  relationships: Partial<Record<CharacterId, string>>;

  summary: string;

  quote?: CharacterQuote;
  quotes?: CharacterQuote[];

  // 🔥 UI layer (optional asset)
  portrait?: string;
  miniPortrait?: string;
}