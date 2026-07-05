import type { Character } from "@/types/character";

export const tionLannister: Character = {
  id: "tion-lannister",

  name: "Tion Lannister",
  nickname: "-",
  aliases: [],

  house: "House Lannister",
  title: "Master of Coin",

  status: "Alive",

  age: 50,
  height: "178 cm",

  father: "Tygett Lannister",
  mother: "Ella Lannister",

  spouse: "Myrielle Lannister",

  siblings: [],

  mentor: "-",

  dragon: "-",

  traits: [
    "Shrewd",
    "Practical",
    "Unpopular at Court",
    "Financially Minded"
  ],

  goals: [
    "Keep the Crown solvent",
    "Temper the royal family's costlier impulses",
    "Survive the King's temper long enough to matter"
  ],

  relationships: {
    "jacaelon-targaryen":
      "Finds an unlikely, if uneasy, ally in the Hand's more measured economic instincts.",

    "gaelor-targaryen":
      "Dismisses his war-hungry proposals as reckless, and is dismissed right back.",

    "baelenys-targaryen":
      "Regularly rebuked for prioritizing the treasury over the King's pride."
  },

  summary:
    "As Master of Coin, Tion Lannister spends most small council meetings being outvoted by princes eager for war and glory. He argued against pouring Highgarden's reparations straight into a campaign for the Stepstones, pointing out — correctly, and to no effect — that a war with no clear end is not an investment. His counsel is sound and almost never followed, which suits the realm's finances poorly and its wars well."
};
