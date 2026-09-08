export type CharacterStatus = "Alive" | "Dead" | "Unknown" | "Missing";

export type CharacterAgeState =
  | "child"
  | "young"
  | "youth"
  | "adult"
  | "elder";

export type CharacterId =
  | "aenys-targaryen-ii"
  | "alester-dayne"
  | "almar-larchmont"
  | "alysa-targaryen"
  | "alysanne-hightower"
  | "alyssa-velaryon"
  | "annara-celtigar"
  | "baelenys-targaryen"
  | "baelor-targaryen"
  | "baran-strong"
  | "benjen-stark"
  | "berholt-caswell"
  | "bethany-bracken"
  | "brandon-stark"
  | "brannyn-vance"
  | "brant-costayne"
  | "clarisse-flowers"
  | "clover-tully"
  | "cordin-poole"
  | "curtass-whent"
  | "daria-sand"
  | "darren-dayne"
  | "derrin-hightower"
  | "drack-harlaw"
  | "edmyn-uller"
  | "edwyle-stark"
  | "ella-lannister"
  | "elwood-tully"
  | "gaelor-targaryen"
  | "godfrey-blackwood"
  | "grance-morrigen"
  | "harrik-greyjoy"
  | "hrrm"
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
  | "meria-martell"
  | "mother-marya"
  | "myles-mooton"
  | "myrielle-marbrand"
  | "naela-targaryen"
  | "naella-velaryon"
  | "nymor-martell"
  | "orwell-morrigen"
  | "oscar-tully"
  | "perric-bracken"
  | "renrose-tyrell"
  | "rhaella-targaryen"
  | "rickard-stark"
  | "ronnel-arryn"
  | "saathos-maris"
  | "saera-targaryen"
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

  /** Hidden characters stay directly routable but are omitted from discovery surfaces. */
  hidden?: boolean;

  house: string;
  title: string;

  status: CharacterStatus;
  secret?: { status: CharacterStatus; note?: string };

  /** @deprecated legacy static age */
  age?: number;
  nameday?: CharacterNameday | null;
  death?: CharacterDeath;

  /**
   * Optional visual override for the canonical root portrait.
   * When omitted, the state is derived from the character's current in-world age.
   */
  portraitAgeState?: CharacterAgeState;

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
