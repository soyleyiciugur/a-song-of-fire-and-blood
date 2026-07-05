import type { Character } from "@/types/character";

export const jaeryTargaryen: Character = {
  id: "jaery-targaryen",

  name: "Jaery Targaryen",
  nickname: "-",
  aliases: [],

  house: "House Targaryen",
  title: "Queen of the Seven Kingdoms",

  status: "Alive",

  age: 48,
  height: "166 cm",

  father: "-",
  mother: "-",

  spouse: "baelenys-targaryen",

  siblings: ["Vaenarr Targaryen"],

  children: [
    "saera-targaryen",
    "visenor-targaryen",
    "gaelor-targaryen",
    "maela-targaryen",
    "jacaelon-targaryen",
    "vhaemys-targaryen"
  ],

  mentor: "-",

  dragon: "-",

  traits: [
    "Calm",
    "Diplomatic",
    "Protective",
    "Quietly Ruthless"
  ],

  goals: [
    "Keep the royal family together",
    "Prevent Baelenys from destroying the family",
    "Secure strong marriages for her remaining children"
  ],

  relationships: {
    "baelenys-targaryen":
      "Often the last voice able to temper the king's fury, though even she has limits to her influence.",

    "jacaelon-targaryen":
      "Pinned the Hand's badge to his chest herself, telling him plainly that she is proud of him — a rare moment of open warmth from a woman who shows little.",

    "gaelor-targaryen":
      "Reminds him constantly that he is heir now, and that a prince wandering the city until dawn reeking of wine is unacceptable.",

    "maela-targaryen":
      "Actively arranging her marriage prospects, from Lord Arryn to the Young Stag of Storm's End."
  },

  summary:
    "Queen Jaery rarely speaks during court, yet her presence is often the last barrier between Baelenys and complete fury. She quietly attempts to preserve what remains of the royal family's unity, steering her children's marriages and futures from behind the scenes even as the realm threatens to come apart around her. It was Jaery, not the King, who publicly recognized Jacaelon's new role as Hand — and who insisted the smallfolk, not the treasury, would not pay for Gaelor's wedding."
};
