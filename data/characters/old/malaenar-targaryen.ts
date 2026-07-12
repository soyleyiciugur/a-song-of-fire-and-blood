// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\data\characters\old\malaenar-targaryen.ts
import type { Character } from "@/types/character";

export const malaenarTargaryen: Character = {
  id: "malaenar-targaryen",

  name: "Malaenar Targaryen",
  nickname: "-",
  aliases: [],

  house: "House Targaryen",
  title: "Lord of Dragonstone",

  status: "Alive",

  age: 60,
  height: "177 cm",

  father: "Aenys Targaryen II",
  mother: "Vhaemys Targaryen",

  spouse: "Alysa Targaryen",

  siblings: ["baelenys-targaryen", "vahaemon-targaryen"],

  mentor: "-",

  dragon: "-",

  traits: [
    "Loyal",
    "Steady",
    "Traditionalist",
    "Overshadowed"
  ],

  goals: [
    "Hold Dragonstone quietly in the King's name",
    "Remain above the intrigues consuming his brother's children",
    "Avoid ever repeating his other brother's fate"
  ],

  relationships: {
    "baelenys-targaryen":
      "His younger brother and King; he has never once challenged his rule, nor been asked to.",

    "vahaemon-targaryen":
      "His other brother, whose treason and exile still cast a long shadow over the family name."
  },

  summary:
    "The eldest of Aenys Targaryen II's three sons, Malaenar chose loyalty over ambition long ago and has held Dragonstone quietly and competently ever since. Standing between a brother who wears the crown and one who wears the name 'Traitor', Malaenar's unremarkable steadiness has become its own kind of virtue — he is the one Targaryen sibling of his generation nobody has ever had reason to distrust."
};
