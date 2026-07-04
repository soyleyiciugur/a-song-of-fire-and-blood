import type { Character } from "@/types/character";

export const visenorTargaryen: Character = {
  id: "visenor-targaryen",

  name: "Visenor Targaryen",
  nickname: "-",
  aliases: [],

  house: "House Targaryen",
  title: "Crown Prince",

  status: "Missing",

  age: 23,
  height: "180 cm",

  father: "baelenys-targaryen",
  mother: "jaery-targaryen",

  spouse: "rhaella-targaryen",

  siblings: [
    "saera-targaryen",
    "gaelor-targaryen",
    "maela-targaryen",
    "jacaelon-targaryen",
    "vhaemys-targaryen"
  ],

  mentor: "-",

  dragon: "Three Hatchlings",

  traits: [
    "Scholar",
    "Strategist",
    "Diplomatic",
    "Physically Weak",
    "Bookish",
    "Idealistic"
  ],

  goals: [
    "Protect Rhaella",
    "Avoid civil war",
    "Become a worthy king",
    "Keep the family together"
  ],

  relationships: {
    "baelenys-targaryen":
      "Once the king's most trusted child. That trust has now been shattered.",

    "rhaella-targaryen":
      "His greatest love and greatest weakness.",

    "jacaelon-targaryen":
      "His opinion of Jace changed completely after learning of his secret help.",

    "gaelor-targaryen":
      "Often disagrees with his methods.",

    "saera-targaryen":
      "One of the siblings he trusts most."
  },

  summary:
    "Raised from childhood to inherit the Iron Throne, Visenor devoted his life to scholarship rather than warfare. Frail in body but sharp in mind, he spent years believing diplomacy could solve almost anything. The poisoning crisis destroyed that illusion. Forced to choose between his father's trust and his wife's life, he lost both. After Baelenys demanded that he murder Rhaella to regain his place as heir, Visenor secretly fled King's Landing with her under Jace's protection. His three dragons, however, remain trapped inside the Red Keep."
};