import type { Character } from "@/types/character";

export const jacaelonTargaryen: Character = {
  id: "jacaelon-targaryen",

  name: "Jacaelon Targaryen",
  nickname: "Jace",
  aliases: ["The Hand"],

  house: "House Targaryen",
  title: "Hand of the King",

  status: "Alive",

  age: 17,
  height: "175 cm",

  father: "baelenys-targaryen",
  mother: "jaery-targaryen",

  spouse: "-",

  siblings: [
    "saera-targaryen",
    "visenor-targaryen",
    "gaelor-targaryen",
    "maela-targaryen",
    "vhaemys-targaryen"
  ],

  mentor: "ser-alester-dayne",

  dragon: "Jhagar",

  traits: [
    "Manipulative",
    "Charismatic",
    "Highly Perceptive",
    "Paranoid",
    "Strategic",
    "Ruthless",
    "Chaotic Neutral"
  ],

  goals: [
    "Earn Baelenys' respect",
    "Protect House Targaryen, whatever the cost",
    "Consolidate his power as Hand of the King",
    "Build a powerful spy network",
    "Bring Visenor and Rhaella home safely, in secret",
    "Uncover the full extent of the Tyrell-Hightower conspiracy"
  ],

  relationships: {
    "baelenys-targaryen":
      "A complicated love-hate relationship driven by a desperate need for approval — one his father finally granted him by naming him Hand.",

    "maela-targaryen":
      "His twin and emotional anchor.",

    "saera-targaryen":
      "One of the few siblings he genuinely trusts.",

    "visenor-targaryen":
      "Once looked down on him and considered him weak; risking everything to save him and Rhaella changed that completely.",

    "gaelor-targaryen":
      "Their rivalry has only sharpened now that Jace holds the Hand's pin and Gaelor stands to inherit the throne.",

    "ser-alester-dayne":
      "His closest friend, mentor, and the man he sent into mortal danger to save Visenor — a debt that haunts him.",

    "derrin-hightower":
      "Exposed his treason, extracted his confession in private, and executed him himself. Only the King knows the truth of what happened that night at Driftmark.",

    "vhaemys-targaryen":
      "The little princess who feels safest in his hands, unaware of everything he has done to keep the family standing."
  },

  summary:
    "Prince Jacaelon has become one of the kingdom's sharpest political minds despite his young age. During the poisoning crisis he uncovered Rhaella's secret correspondence, orchestrated investigations against the Hand, protected Visenor despite publicly humiliating him, and secretly arranged his escape to Dorne through Ser Alester Dayne. He confirmed Derrin Hightower's treason with forged evidence and a confession extracted in a locked room at Driftmark — then executed the old Hand himself and hid the body at sea. Rewarded with the Hand's pin by his own mother, Jace now rules much of the realm's day-to-day business at his father's side, using fear, patience, and a growing spy network led by the pardoned whisperer Weylar Rocke to hold House Targaryen together while paranoia over what he has become quietly consumes him."
};
