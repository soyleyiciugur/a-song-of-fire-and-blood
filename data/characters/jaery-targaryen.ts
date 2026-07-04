import type { Character } from "@/types/character";

export const jaeryTargaryen: Character = {
  id: "jaery-targaryen",

  name: "Jaery Targaryen",
  nickname: "-",
  aliases: [],

  house: "House Targaryen",
  title: "Queen",

  status: "Alive",

  age: 48,
  height: "-",

  father: "-",
  mother: "-",

  spouse: "baelenys-targaryen",

  siblings: [],

  children: [
    "saera-targaryen",
    "visenor-targaryen",
    "gaelor-targaryen",
    "maela-targaryen",
    "jacaelon-targaryen",
    "vhaemys-targaryen"
  ],

  mentor: "-",

  dragon: "-",

  traits: [
    "Calm",
    "Diplomatic",
    "Protective"
  ],

  goals: [
    "Keep the royal family together",
    "Prevent Baelenys from destroying the family"
  ],

  relationships: {
    "baelenys-targaryen":
      "Often tries to calm the king's anger."
  },

  summary:
    "Queen Jaery rarely speaks during court, yet her presence is often the last barrier between Baelenys and complete fury. She quietly attempts to preserve what remains of the royal family's unity."
};