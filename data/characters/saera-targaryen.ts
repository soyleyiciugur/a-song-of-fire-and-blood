import type { Character } from "@/types/character";

export const saeraTargaryen: Character = {
  id: "saera-targaryen",

  name: "Saera Targaryen",
  nickname: "Cloud Eyes",
  aliases: [],

  house: "House Targaryen",
  title: "Princess",

  status: "Alive",

  age: 20,
  height: "169 cm",

  father: "baelenys-targaryen",
  mother: "jaery-targaryen",

  spouse: "-",

  siblings: [
    "visenor-targaryen",
    "gaelor-targaryen",
    "maela-targaryen",
    "jacaelon-targaryen",
    "vhaemys-targaryen"
  ],

  mentor: "-",

  dragon: "Cloudgazer",

  traits: [
    "Dragonrider",
    "Reserved",
    "Mysterious",
    "Observant",
    "Quietly Compassionate"
  ],

  goals: [
    "Maintain the family's fragile unity",
    "Build alliances beyond the capital",
    "Protect Visenor and Rhaella however she can from afar"
  ],

  relationships: {
    "baelenys-targaryen":
      "Frequently opposes the king's decisions and has grown increasingly wary of him since the poisoning.",

    "jacaelon-targaryen":
      "Works closely with him and is one of the few people able to see through his composure.",

    "visenor-targaryen":
      "Supported him during the Rhaella affair and helped shield the truth from their father as long as she could.",

    "rickard-stark":
      "Sent north to offer the Crown's condolences on his father's death, she found an unexpected, unspoken warmth in his company."
  },

  summary:
    "Known throughout the realm as 'Cloud Eyes', Saera's mysterious gaze has only grown cloudier over time. Quiet yet perceptive, she commands unusual affection from dragons and smallfolk alike, and commands one of the realm's most valuable intelligence networks besides. Sent to Winterfell to honor Lord Brandon Stark's death, she lingered a full week longer than expected, drawn to the new Lord Rickard Stark and to a North quieter and more honest than anything she has known in King's Landing."
};
