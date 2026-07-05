import type { Character } from "@/types/character";

export const cordinPoole: Character = {
  id: "cordin-poole",

  name: "Cordin Poole",
  nickname: "-",
  aliases: [],

  house: "-",
  title: "Grand Maester",

  status: "Alive",

  age: 68,
  height: "168 cm",

  father: "-",
  mother: "-",

  spouse: "-",

  siblings: [],

  mentor: "-",

  dragon: "-",

  traits: [
    "Sycophantic",
    "Cautious",
    "Long-Serving",
    "Politically Timid"
  ],

  goals: [
    "Preserve his position at court",
    "Avoid the King's wrath",
    "Offer counsel that offends no one"
  ],

  relationships: {
    "baelenys-targaryen":
      "Serves as his Grand Maester, though his counsel rarely amounts to more than agreement.",

    "jacaelon-targaryen":
      "A frequent target of the Hand's sharpest sarcasm for his fawning, empty flattery.",

    "gaelor-targaryen":
      "Openly courts his favor, hoping to curry goodwill with the likely heir."
  },

  summary:
    "Grand Maester Cordin Poole has served House Targaryen faithfully for decades, and it shows in every carefully hedged word he offers the small council. He rarely disagrees with the King and even more rarely survives an exchange with Jacaelon's tongue unscathed. Yet beneath the sycophancy occasionally surfaces an uncomfortable truth, as when he coldly reminded the council that sons sometimes pay for their fathers' ambitions."
};
