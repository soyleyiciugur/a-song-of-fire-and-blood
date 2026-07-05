import type { Character } from "@/types/character";

export const baelorTargaryen: Character = {
  id: "baelor-targaryen",

  name: "Baelor Targaryen",
  nickname: "-",
  aliases: [],

  house: "House Targaryen",
  title: "Maester",

  status: "Alive",

  age: 67,
  height: "174 cm",

  father: "-",
  mother: "-",

  spouse: "-",

  siblings: [],

  mentor: "-",

  dragon: "-",

  traits: [
    "Scholarly",
    "Argumentative",
    "Politically Astute",
    "Self-Exiled"
  ],

  goals: [
    "Advise the Crown before its impulsiveness costs it everything",
    "Prevent a wider war with the Reach",
    "Guide Jacaelon, in whom he sees a reflection of himself"
  ],

  relationships: {
    "baelenys-targaryen":
      "His great-nephew and King, who summoned him back from the Citadel after years of self-imposed exile.",

    "jacaelon-targaryen":
      "The King himself compares the two as kindred spirits — scholars and dissenters born into a family of warriors.",

    "gaelor-targaryen":
      "Greeted warmly on the road, though visibly horrified upon learning of the massacre at Oldtown."
  },

  summary:
    "Decades ago, Baelor Targaryen forsook his own claim to the Iron Throne for a quieter life of study at the Citadel, earning a reputation as 'the argumentative one' of his generation — a title the King now pointedly applies to his own son Jacaelon. Recalled to King's Landing amid rumors of Tyrell and Hightower treason, Baelor arrives too late to stop Gaelor's bloody campaign in the Reach and rides for the Red Keep in open alarm, desperate to find Jace before the realm's fragile peace unravels entirely."
};
