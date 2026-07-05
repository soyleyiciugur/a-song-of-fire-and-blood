import type { Character } from "@/types/character";

export const timosHightower: Character = {
  id: "timos-hightower",

  name: "Timos Hightower",
  nickname: "-",
  aliases: [],

  house: "House Hightower",
  title: "Lord of Oldtown",

  status: "Dead",

  age: 15,
  height: "169 cm",

  father: "derrin-hightower",
  mother: "-",

  spouse: "-",

  siblings: ["alysanne-hightower"],

  mentor: "-",

  dragon: "-",

  traits: [
    "Young",
    "Frightened",
    "Desperate",
    "Innocent of his father's crimes"
  ],

  goals: [
    "Survive the Crown's judgment",
    "Protect his sisters",
    "Preserve what remained of House Hightower's honor"
  ],

  relationships: {
    "derrin-hightower":
      "His father, whose secret treason condemned him before he understood what was happening.",

    "gaelor-targaryen":
      "Begged him for parley and mercy; was beheaded by his hand regardless.",

    "alysanne-hightower":
      "His older sister, killed in the same massacre that claimed his life moments later."
  },

  summary:
    "Thrust into Oldtown's lordship the moment his father vanished under suspicion, fifteen-year-old Timos Hightower tried desperately to comply with the Crown's demands. It was not enough. When Prince Gaelor arrived to claim his life as payment for a treason he had no part in, panic drove the boy to draw steel. He never had a chance to use it. His death, and the massacre it triggered, will be remembered in the Reach for a hundred years."
};
