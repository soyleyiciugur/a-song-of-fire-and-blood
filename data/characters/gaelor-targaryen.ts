import type { Character } from "@/types/character";

export const gaelorTargaryen: Character = {
  id: "gaelor-targaryen",

  name: "Gaelor Targaryen",
  nickname: "-",
  aliases: [],

  house: "House Targaryen",
  title: "Prince",

  status: "Alive",

  age: 18,
  height: "188 cm",

  father: "baelenys-targaryen",
  mother: "jaery-targaryen",

  spouse: "naella-velaryon (betrothed)",

  siblings: [
    "saera-targaryen",
    "visenor-targaryen",
    "maela-targaryen",
    "jacaelon-targaryen",
    "vhaemys-targaryen"
  ],

  mentor: "ser-saathos-maris",

  dragon: "Bayle",

  traits: [
    "Knight",
    "Impulsive",
    "Fearless",
    "Poor Politician",
    "Warrior"
  ],

  goals: [
    "Protect the Crown",
    "Become worthy of Blackfyre"
  ],

  relationships: {
    "baelenys-targaryen":
      "His loyalty has brought him closer to the king.",

    "jacaelon-targaryen":
      "Frequently clashes with him.",

    "visenor-targaryen":
      "Frustrated by what he sees as weakness.",

    "ser-saathos-maris":
      "Trusted knight and mentor.",

    "naella-velaryon":
      "Betrothed."
  },

  summary:
    "A natural warrior rather than a statesman, Gaelor's courage often outruns his judgment. His brutal investigation into the poisoning uncovered the dying accusation against the Hand, yet he concealed that revelation even from his siblings. Following the royal dinner, King Baelenys stripped Blackfyre from Visenor and bestowed the legendary sword upon Gaelor, marking a dramatic shift within the royal family."
};