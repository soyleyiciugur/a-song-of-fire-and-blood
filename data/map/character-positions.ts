import type { CharacterId } from "@/types/character";

/**
 * Where each character is standing during a given chapter.
 *
 * A character may be in one location:
 *   "gaelor-targaryen": "Oldtown"
 *
 * ...or multiple locations if they travel during the chapter:
 *   "gaelor-targaryen": ["Oldtown", "King's Landing"]
 */
export type CharacterLocation = string | string[];

export const CHAPTER_CHARACTER_POSITIONS: Record<
  string,
  Partial<Record<CharacterId, CharacterLocation>>
> = {
  "the-poison-beneath-the-crown": { // chapter 1
    "baelenys-targaryen": "King's Landing",
    "visenor-targaryen": "King's Landing",
    "jacaelon-targaryen": "King's Landing",
    "saera-targaryen": "King's Landing",
    "gaelor-targaryen": "King's Landing",
    "rhaella-targaryen": "King's Landing",
    "ser-saathos-maris": "Driftmark",
    "ser-alester-dayne": "King's Landing",
    "derrin-hightower": "King's Landing",
    "lorenah-dayne": "Starfall",
    "vhaemys-targaryen": "King's Landing",
    "naella-velaryon": "Driftmark",
  },

  "the-price-of-trust": { // chapter 2
    "baelenys-targaryen": "King's Landing",
    "visenor-targaryen": "King's Landing",
    "jacaelon-targaryen": ["Sunspear", "Starfall", "King's Landing"],
    "saera-targaryen": "King's Landing",
    "gaelor-targaryen": ["King's Landing", "Driftmark", "King's Landing"],
    "rhaella-targaryen": "King's Landing",
    "ser-saathos-maris": ["Driftmark", "King's Landing"],
    "ser-alester-dayne": ["Sunspear", "Starfall", "King's Landing"],
    "derrin-hightower": "King's Landing",
    "lorenah-dayne": "Starfall",
    "vhaemys-targaryen": "King's Landing",
    "naella-velaryon": "Driftmark",
  },

  "the-weight-of-loyalty": { // chapter 3
    "baelenys-targaryen": ["King's Landing", "Driftmark", "King's Landing"],
    "gaelor-targaryen": ["King's Landing", "Driftmark"],
    "naella-velaryon": "Driftmark",
    "jacaelon-targaryen": ["King's Landing", "Driftmark", "King's Landing"],
    "derrin-hightower": ["King's Landing", "Driftmark"],
    "visenor-targaryen": "The Dornish Marches",
    "saera-targaryen": ["King's Landing", "Driftmark", "King's Landing"],
    "rhaella-targaryen": "The Dornish Marches",
    "ser-saathos-maris": ["King's Landing", "Driftmark"],
    "ser-alester-dayne": "The Dornish Marches",
    "curtass-whent": "The Dornish Marches",
    "vhaemys-targaryen": ["King's Landing", "Driftmark", "King's Landing"],
    "jaery-targaryen": ["King's Landing", "Driftmark", "King's Landing"],
  },

  "the-broken-knight": {  // chapter 4
    "baelenys-targaryen": "King's Landing",
    "jacaelon-targaryen": "King's Landing",
    "gaelor-targaryen": "King's Landing",
    "baelor-targaryen": "Oldtown",
    "visenor-targaryen": "The Dornish Marches",
    "saera-targaryen": ["King's Landing", "Winterfell", "Castle Black"],
    "rhaella-targaryen": "The Dornish Marches",
    "ser-saathos-maris": "King's Landing",
    "ser-alester-dayne": "The Dornish Marches",
    "cordin-poole": "King's Landing",
    "curtass-whent": "The Dornish Marches",
    "jaery-targaryen": "King's Landing",
    "maela-targaryen": "King's Landing",
    "vhaemys-targaryen": "King's Landing",
    "rickard-stark": ["Winterfell", "Castle Black"],
  },

  "fathers-and-their-sins": { // chapter 5
    "baelenys-targaryen": "King's Landing",
    "gaelor-targaryen": ["King's Landing", "Oldtown", "King's Landing"],
    "ser-saathos-maris": ["King's Landing", "Oldtown", "King's Landing"],
    "jacaelon-targaryen": "King's Landing",
    "maela-targaryen": ["King's Landing", "Storm's End", "King's Landing"],
    "visenor-targaryen": "Starfall",
    "rhaella-targaryen": "Starfall",
    "saera-targaryen": ["Castle Black", "Winterfell", "King's Landing"],
    "baelor-targaryen": ["Oldtown", "King's Landing"],
    "jaery-targaryen": "King's Landing",
    "lorenah-dayne": "Starfall",
    "ser-alester-dayne": "Starfall",
    "cordin-poole": "King's Landing",
    "steffon-baratheon": "Storm's End",
    "timos-hightower": "Oldtown",
    "vhaemys-targaryen": "King's Landing",
    "rickard-stark": ["Castle Black", "Winterfell"],
  },
  
  "a-crown-of-thorns": { // chapter 6 
    "baelenys-targaryen": "King's Landing",
    "gaelor-targaryen": "King's Landing",
    "ser-saathos-maris": "King's Landing",
    "jacaelon-targaryen": "King's Landing",
    "maela-targaryen": "King's Landing",
    "visenor-targaryen": "Starfall",
    "rhaella-targaryen": "Starfall",
    "saera-targaryen": "King's Landing",
    "baelor-targaryen": "King's Landing",
    "jaery-targaryen": "King's Landing",
    "lorenah-dayne": ["Starfall", "King's Landing"],
    "ser-alester-dayne": ["Starfall", "King's Landing"],
    "cordin-poole": "King's Landing",
    "steffon-baratheon": "Storm's End",
    "vhaemys-targaryen": "King's Landing",
  },

  "the-climb-and-the-kneel": { // chapter 7 
    "baelenys-targaryen": "King's Landing",
    "gaelor-targaryen": "King's Landing",
    "ser-saathos-maris": "King's Landing",
    "jacaelon-targaryen": "King's Landing",
    "maela-targaryen": "King's Landing",
    "visenor-targaryen": ["Starfall", "The Red Mountains", "Starfall"],
    "rhaella-targaryen": "Starfall",
    "saera-targaryen": "King's Landing",
    "baelor-targaryen": "King's Landing",
    "jaery-targaryen": "King's Landing",
    "lorenah-dayne": "King's Landing",
    "ser-alester-dayne": "King's Landing",
    "cordin-poole": "King's Landing",
    "steffon-baratheon": "Storm's End",
    "vhaemys-targaryen": "King's Landing",
    "naella-velaryon": "King's Landing",
  },
};  

export function getCharacterPositionsForChapter(
  chapterSlug: string
): Partial<Record<CharacterId, CharacterLocation>> {
  return CHAPTER_CHARACTER_POSITIONS[chapterSlug] ?? {};
}