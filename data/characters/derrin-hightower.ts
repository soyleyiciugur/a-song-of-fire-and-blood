import type { Character } from "@/types/character";

export const derrinHightower: Character = {
  id: "derrin-hightower",

  name: "Derrin Hightower",
  nickname: "-",
  aliases: [],

  house: "House Hightower",
  title: "Former Hand of the King",

  status: "Missing",

  secret: {
    status: "Dead",
    note: "Executed by Jacaelon Targaryen in a locked chamber at Driftmark after confessing his treason. His body was given to the sea. Only the King and his new Hand know the truth.",
  },

  age: 68,
  height: "170 cm",

  father: "-",
  mother: "-",

  spouse: "-",

  siblings: [],

  children: ["timos-hightower", "alysanne-hightower"],

  mentor: "-",

  dragon: "-",

  traits: [
    "Experienced",
    "Patient",
    "Political",
    "Secretive",
    "Treasonous",
    "Idealistic"
  ],

  goals: [
    "-"
  ],

  relationships: {
    "baelenys-targaryen":
      "Old friend and, until his fall, the King's most trusted Hand — a friendship he betrayed for a cause he believed was greater.",

    "jacaelon-targaryen":
      "The prince who exposed his treason, extracted his confession in a locked room at Driftmark, and executed him personally.",

    "timos-hightower":
      "His son, condemned and killed for a treason he never had any part in."
  },

  summary:
    "For decades Derrin Hightower served as Baelenys' Hand and closest political adviser. After the poisoning attempt, he became the center of suspicion when the dying assassin allegedly whispered only two words: 'the Hand.' Confronted alone by Jacaelon at Driftmark, Derrin confessed everything: he had conspired with the Lord of Highgarden to poison the King, believing the realm could no longer survive Baelenys' wars and taxes, and that he acted for House Targaryen's future rather than against it. Jace executed him on the spot and disposed of his body at sea. To the realm, Derrin Hightower remains simply missing — his true fate known only to the King and his new Hand."
};
