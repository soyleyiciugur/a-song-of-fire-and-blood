import type { Character } from "@/types/character";

export const darrenDayne: Character = {
  id: "darren-dayne",

  name: "Darren Dayne",
  nickname: "-",
  aliases: [],

  house: "House Dayne",
  title: "Lord of Torrentine",

  status: "Alive",

  age: 38,
  height: "185 cm",

  father: "-",
  mother: "-",

  spouse: "-",

  siblings: [],

  children: ["lorenah-dayne"],

  mentor: "-",

  dragon: "-",

  traits: [
    "Reserved",
    "Protective",
    "Pragmatic",
    "Dornish Lord"
  ],

  goals: [
    "Safeguard House Dayne's holdings along the Torrentine",
    "Keep his children away from King's Landing's wars",
    "Preserve Dorne's neutrality in the Crown's troubles"
  ],

  relationships: {
    "lorenah-dayne":
      "His daughter, whom he has tried, and largely failed, to keep sheltered from the intrigues of the crown."
  },

  summary:
    "The quiet Lord of Torrentine, Darren Dayne has stayed carefully out of King's Landing's politics for most of his life, content to let his daughter Lorenah manage House Dayne's more delicate affairs. Neither he nor his seat ever expected to become entangled in sheltering a fugitive Crown Prince, but that is precisely what his family's choices have made of them."
};
