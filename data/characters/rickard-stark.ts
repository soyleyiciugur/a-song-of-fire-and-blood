import type { Character } from "@/types/character";

export const rickardStark: Character = {
  id: "rickard-stark",

  name: "Rickard Stark",
  nickname: "-",
  aliases: [],

  house: "House Stark",
  title: "Lord of Winterfell and Warden of the North",

  status: "Alive",

  age: 23,
  height: "183 cm",

  father: "brandon-stark",
  mother: "-",

  spouse: "-",

  siblings: [],

  mentor: "-",

  dragon: "-",

  traits: [
    "Solemn",
    "Honorable",
    "Plainspoken",
    "Grieving"
  ],

  goals: [
    "Rule the North well in his father's stead",
    "Mend the old, uneasy distance between Winterfell and the Iron Throne",
    "Win Princess Saera's regard"
  ],

  relationships: {
    "saera-targaryen":
      "Welcomed her to Winterfell during his mourning and found himself unexpectedly, cautiously drawn to her.",

    "brandon-stark":
      "His late father, whose death brought the North and the Iron Throne back into contact after years of quiet distance."
  },

  summary:
    "Newly burdened with Winterfell upon his father's death, Rickard Stark received Princess Saera's visit of condolence with the plain, unadorned courtesy the North is known for. What began as diplomacy became something warmer by the time he showed her the Wall, though neither of them dared name it. Rickard hopes the visit marks the beginning of a steadier peace between his house and the dragons who once fought beside his grandfather."
};
