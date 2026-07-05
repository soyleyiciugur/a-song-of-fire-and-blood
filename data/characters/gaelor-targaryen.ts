import type { Character } from "@/types/character";

export const gaelorTargaryen: Character = {
  id: "gaelor-targaryen",

  name: "Gaelor Targaryen",
  nickname: "-",
  aliases: ["Heir Presumptive"],

  house: "House Targaryen",
  title: "Prince",

  status: "Alive",

  age: 18,
  height: "188 cm",

  father: "baelenys-targaryen",
  mother: "jaery-targaryen",

  spouse: "naella-velaryon",

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
    "Warrior",
    "Increasingly Ruthless"
  ],

  goals: [
    "Prove himself worthy of Blackfyre and the throne",
    "Crush the Tyrell-Hightower conspiracy",
    "Lead the campaign to take the Stepstones"
  ],

  relationships: {
    "baelenys-targaryen":
      "His loyalty has brought him closer to the king, who has named him heir should Visenor not return.",

    "jacaelon-targaryen":
      "Frequently clashes with him, especially now that Jace holds the Hand's pin and keeps him deliberately out of the loop.",

    "visenor-targaryen":
      "Frustrated by what he sees as weakness, though it was Gaelor who broke the poisoner's confession out of the assassin himself.",

    "ser-saathos-maris":
      "Trusted knight, mentor, and drinking companion who indulges his temper more than he probably should.",

    "naella-velaryon":
      "His wife since their wedding at Driftmark; he has found unexpected comfort and honesty in their marriage.",

    "timos-hightower":
      "Executed him personally at Oldtown to enforce the King's justice — a killing that spiraled into a massacre he did not fully intend."
  },

  summary:
    "A natural warrior rather than a statesman, Gaelor's courage often outruns his judgment. His brutal investigation into the poisoning uncovered the dying accusation against the Hand, yet he concealed that revelation even from his siblings. After King Baelenys stripped Blackfyre from Visenor and bestowed it upon him, Gaelor married Naella Velaryon at Driftmark and was named heir should his brother not return. Sent to Oldtown to demand Hightower blood for Derrin's treason, he beheaded young Lord Timos Hightower when the boy panicked, triggering a massacre that slaughtered every Hightower knight present and killed two innocent Hightower sisters in the chaos. He returned home covered in the blood of the Reach, already eyeing the Stepstones as his next campaign."
};
