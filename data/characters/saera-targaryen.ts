import type { Character } from "@/types/character";

export const saeraTargaryen: Character = {
  id: "saera-targaryen",

  name: "Saera Targaryen",
  nickname: "Cloud Eyes",
  aliases: [],

  house: "House Targaryen",
  title: "Princess",

  status: "Alive",

  age: 20,
  height: "-",

  father: "baelenys-targaryen",
  mother: "jaery-targaryen",

  spouse: "-",

  siblings: [
    "visenor-targaryen",
    "gaelor-targaryen",
    "maela-targaryen",
    "jacaelon-targaryen",
    "vhaemys-targaryen"
  ],

  mentor: "-",

  dragon: "Cloudgazer",

  traits: [
    "Dragonrider",
    "Reserved",
    "Mysterious",
    "Observant"
  ],

  goals: [
    "-"
  ],

  relationships: {
    "baelenys-targaryen":
      "Frequently opposes the king's decisions.",

    "jacaelon-targaryen":
      "Works closely with him.",

    "visenor-targaryen":
      "Supported him during the Rhaella affair."
  },

  summary:
    "Known throughout the realm as 'Cloud Eyes', Saera's mysterious gaze has only grown cloudier over time. Quiet yet perceptive, she commands unusual affection from dragons and from the smallfolk alike. Beneath her reserved nature lies one of the realm's most valuable intelligence networks."
};