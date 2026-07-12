// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\data\characters\old\vahaemon-targaryen.ts
import type { Character } from "@/types/character";

export const vahaemonTargaryen: Character = {
  id: "vahaemon-targaryen",

  name: "Vahaemon Targaryen",
  nickname: "-",
  aliases: [],

  house: "House Targaryen",
  title: "Traitor",

  status: "Alive",

  age: 55,
  height: "180 cm",

  father: "Aenys Targaryen II",
  mother: "Vhaemys Targaryen",

  spouse: "Naela Velaryon",

  siblings: ["baelenys-targaryen", "malaenar-targaryen"],

  children: ["rhaella-targaryen", "-"],

  mentor: "-",

  dragon: "-",

  traits: [
    "Exiled",
    "Bitter",
    "Cunning",
    "Estranged"
  ],

  goals: [
    "Regain some measure of standing for his name",
    "Protect his daughter from afar",
    "Survive the consequences of his own old betrayal"
  ],

  relationships: {
    "baelenys-targaryen":
      "His brother and King, who exiled him for treason years before the poisoning crisis and has never forgiven him.",

    "rhaella-targaryen":
      "His daughter. Her secret letters to her siblings beyond the realm's borders reignited the very suspicion that nearly destroyed her marriage, though the warning was never addressed to him."
  },

  summary:
    "Exiled from Westeros years before the events of the poisoning, Vahaemon Targaryen lives on beyond the Seven Kingdoms' reach, cut off from the family that once called him brother. His sons, Rhaella's brothers, remain in exile alongside him; it was to them, not to Vahaemon himself, that Rhaella secretly wrote her warning, a letter that became the spark that nearly unraveled House Targaryen from within — proof, as far as King Baelenys is concerned, that his mistrust of his own blood was never unfounded."
};
