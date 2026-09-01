// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\types\character.ts

export type CharacterStatus = "Alive" | "Dead" | "Unknown" | "Missing";

export type CharacterId =
  | "aenys-targaryen-ii"
  | "almar-larchmont"
  | "alysa-targaryen"
  | "alysanne-hightower"
  | "baelenys-targaryen"
  | "baelor-targaryen"
  | "baran-strong"
  | "berholt-caswell"
  | "bethany-bracken"
  | "brandon-stark"
  | "clover-tully"
  | "cordin-poole"
  | "curtass-whent"
  | "darren-dayne"
  | "derrin-hightower"
  | "edmyn-uller"
  | "ella-lannister"
  | "elwood-tully"
  | "gaelor-targaryen"
  | "godfrey-blackwood"
  | "harrik-greyjoy"
  | "jacaelon-targaryen"
  | "jaery-targaryen"
  | "leo-tyrell"
  | "lorenah-dayne"
  | "lyarra-karstark"
  | "maela-targaryen"
  | "malaenar-targaryen"
  | "maron-dayne"
  | "martyn-mullendore"
  | "melessa-hightower"
  | "myrielle-lannister"
  | "naela-targaryen"
  | "naella-velaryon"
  | "oscar-tully"
  | "perric-bracken"
  | "renrose-tyrell"
  | "rhaella-targaryen"
  | "rickard-stark"
  | "ronnel-arryn"
  | "saera-targaryen"
  | "ser-alester-dayne"
  | "ser-brannyn-vance"
  | "ser-brant-costayne"
  | "ser-orwell-morrigen"
  | "ser-saathos-maris"
  | "steffon-baratheon"
  | "tansy-riverside"
  | "timos-hightower"
  | "tion-lannister"
  | "tygett-lannister"
  | "vaenarr-targaryen"
  | "vahaemon-targaryen"
  | "vhaemys-targaryen"
  | "vhaemys-targaryen-elder"
  | "visenor-targaryen"
  | "visenya-targaryen"
  | "weylar-rocke";

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

export interface CharacterDeath {
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

  /** @deprecated legacy static age */
  age?: number;

  nameday?: CharacterNameday;

  /**
   * Exact date of death.
   * Living characters should omit this field.
   */
  death?: CharacterDeath;

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

  portrait?: string;
  miniPortrait?: string;
}