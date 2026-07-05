import type { Character } from "@/types/character";

export const rhaellaTargaryen: Character = {
  id: "rhaella-targaryen",

  name: "Rhaella Targaryen",
  nickname: "-",
  aliases: [],

  house: "House Targaryen",
  title: "Princess",

  status: "Alive",

  age: 16,
  height: "-",

  father: "vahaemon-targaryen",
  mother: "Naela Velaryon",

  spouse: "visenor-targaryen",

  siblings: ["-"],

  mentor: "-",

  dragon: "-",

  traits: [
    "Gentle",
    "Loyal",
    "Determined",
    "Frightened but Resilient",
    "Torn Between Duty and Love"
  ],

  goals: [
    "Survive",
    "Protect Visenor",
    "Reconnect with her family, wherever exile has scattered them"
  ],

  relationships: {
    "visenor-targaryen":
      "Loves him deeply despite everything her family's name has cost them both.",

    "baelenys-targaryen":
      "Lives in constant fear of him, and with good reason.",

    "vahaemon-targaryen":
      "Her exiled father, whose disgrace hangs over her at court, though it was not to him that her secret warning was sent.",

    "ser-alester-dayne":
      "Watched him nearly die protecting her and Visenor, and has called him a true hero to the realm ever since."
  },

  summary:
    "Daughter of the king's own exiled brother, Vahaemon Targaryen, and wife of Crown Prince Visenor, Rhaella secretly wrote to warn her brothers beyond the realm's borders, a letter that triggered the greatest internal crisis within House Targaryen in a generation. Forced into the center of the poisoning investigation, she fled King's Landing with Visenor under Jace's protection, surviving bandits and a hired hunter before finding uneasy sanctuary at Starfall — all the while unsure whether her own blood makes her a traitor or simply a frightened daughter."
};
