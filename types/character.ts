export type CharacterStatus = "Alive" | "Dead" | "Unknown" | "Missing";

export type CharacterId =
  | "baelenys-targaryen"
  | "jaery-targaryen"
  | "maela-targaryen"
  | "jacaelon-targaryen"
  | "saera-targaryen"
  | "gaelor-targaryen"
  | "visenor-targaryen"
  | "vhaemys-targaryen"
  | "rhaella-targaryen"
  | "naella-velaryon"
  | "lorenah-dayne"
  | "ser-alester-dayne"
  | "derrin-hightower"
  | "ser-saathos-maris"
  | "timos-hightower"
  | "alysanne-hightower"
  | "malaenar-targaryen"
  | "vahaemon-targaryen"
  | "steffon-baratheon"
  | "baelor-targaryen"
  | "brandon-stark"
  | "curtass-whent";


export interface Character {
  id: CharacterId;

  name: string;
  nickname?: string;
  aliases: string[];

  house: string;
  title: string;

  status: CharacterStatus;

  age: number;
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

  relationships: Record<string, string>;

  summary: string;

  // 🔥 UI layer (optional asset)
  portrait?: string;
  miniPortrait?: string;
}