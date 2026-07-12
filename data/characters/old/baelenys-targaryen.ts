// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\data\characters\old\baelenys-targaryen.ts
import type { Character } from "@/types/character";

export const baelenysTargaryen: Character = {
  id: "baelenys-targaryen",

  name: "Baelenys Targaryen",
  nickname: "the Cruel",
  aliases: ["Baelenys the Formidable"],

  house: "House Targaryen",
  title: "King of the Seven Kingdoms",

  status: "Alive",

  age: 58,
  height: "185 cm",

  father: "Aenys Targaryen II",
  mother: "Vhaemys Targaryen",

  spouse: "jaery-targaryen",

  siblings: ["malaenar-targaryen", "vahaemon-targaryen"],

  children: [
    "saera-targaryen",
    "visenor-targaryen",
    "gaelor-targaryen",
    "maela-targaryen",
    "jacaelon-targaryen",
    "vhaemys-targaryen"
  ],

  mentor: "-",

  dragon: "Maelwing",

  traits: [
    "Cruel",
    "Authoritative",
    "Intimidating",
    "Proud",
    "Calculating",
    "Ruthless",
    "Paranoid"
  ],

  goals: [
    "Preserve the Iron Throne",
    "Crush internal betrayal",
    "Win the coming war",
    "Keep House Targaryen united under his rule"
  ],

  relationships: {
    "jaery-targaryen":
      "Trusts her more than most, but rarely lets her influence his decisions.",

    "visenor-targaryen":
      "Formerly his most trusted heir. That trust has been shattered, and Visenor now faces exile or worse.",

    "gaelor-targaryen":
      "Sees growing potential in him and has named him heir should Visenor not return.",

    "jacaelon-targaryen":
      "Respects his intelligence and has made him Hand of the King, though he still despises his constant opposition.",

    "saera-targaryen":
      "Increasingly distrustful, though he still relies on her for delicate diplomatic errands.",

    "rhaella-targaryen":
      "Considers her a political liability and the daughter of a traitor he has never forgiven.",

    "vahaemon-targaryen":
      "His exiled brother. Rhaella's secret letters to her siblings reignited every suspicion Baelenys has ever carried about his own blood.",

    "malaenar-targaryen":
      "His steady, unambitious brother — the one Targaryen sibling he has never had reason to doubt.",

    "derrin-hightower":
      "His oldest friend and, until his execution, his most trusted Hand — a betrayal that cut deeper than the poison itself."
  },

  summary:
    "King Baelenys has ruled the realm through fear, strength, and absolute authority. The poisoning attempt transformed him even further, earning him the name 'Baelenys the Formidable.' Once capable of calculated restraint, he now sees traitors in every shadow. The revelation of Rhaella's secret correspondence with his own exiled brother Vahaemon shattered his already fragile trust in his children, especially Visenor, whom he struck down before the entire court and gave an impossible choice: kill his wife, or lose everything. Having named Jacaelon his new Hand after Derrin Hightower's treason and secret execution, Baelenys now moves toward war with House Tyrell and Hightower with the same merciless certainty that has defined his reign."
};
