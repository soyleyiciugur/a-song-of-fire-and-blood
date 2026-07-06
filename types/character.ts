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
  | "ser-saathos-maris"
  | "steffon-baratheon"
  | "timos-hightower"
  | "tion-lannister"
  | "vahaemon-targaryen"
  | "vhaemys-targaryen"
  | "visenor-targaryen";


export interface Character {
  id: CharacterId;

  name: string;
  nickname?: string;
  aliases: string[];

  house: string;
  title: string;

  status: CharacterStatus;
  secret?: { status: CharacterStatus; note: string };

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