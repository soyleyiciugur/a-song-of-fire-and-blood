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
  "the-poison-beneath-the-crown": {
    "baelenys-targaryen": "King's Landing",
    "visenor-targaryen": "King's Landing",
    "jacaelon-targaryen": "King's Landing",
    "saera-targaryen": "King's Landing",
    "gaelor-targaryen": "King's Landing",
    "rhaella-targaryen": "King's Landing",
    "ser-saathos-maris": "King's Landing",
    "ser-alester-dayne": "King's Landing",
  },

  "the-price-of-trust": {
    "baelenys-targaryen": "King's Landing",
    "visenor-targaryen": "King's Landing",
    "jacaelon-targaryen": ["Sunspear", "Starfall", "King's Landing"],
    "saera-targaryen": "King's Landing",
    "gaelor-targaryen": "Driftmark",
    "rhaella-targaryen": "King's Landing",
    "ser-saathos-maris": "Driftmark",
    "ser-alester-dayne": ["King's Landing", "Starfall"],
    "derrin-hightower": "King's Landing",
    "lorenah-dayne": "Starfall",
    "vhaemys-targaryen": "King's Landing",
  },

  "the-weight-of-loyalty": {
    "baelenys-targaryen": ["King's Landing", "Driftmark"],
    "gaelor-targaryen": ["King's Landing", "Driftmark"],
    "naella-velaryon": "Driftmark",
    "jacaelon-targaryen": ["King's Landing", "Driftmark"],
    "derrin-hightower": ["King's Landing", "Driftmark"],
    "visenor-targaryen": "Bitterbridge",
    "saera-targaryen": ["King's Landing", "Driftmark"],
    "rhaella-targaryen": "Bitterbridge",
    "ser-saathos-maris": "Driftmark",
    "ser-alester-dayne": "Bitterbridge",
    "curtass-whent": "Bitterbridge",
    "vhaemys-targaryen": ["King's Landing", "Driftmark"],
    "jaery-targaryen": ["King's Landing", "Driftmark"],
  },

  "the-broken-knight": {
    "baelenys-targaryen": "King's Landing",
    "jacaelon-targaryen": "King's Landing",
    "gaelor-targaryen": "King's Landing",
    "baelor-targaryen": "Oldtown",
    "visenor-targaryen": "Bitterbridge",
    "saera-targaryen": ["King's Landing", "Winterfell"],
    "rhaella-targaryen": "Bitterbridge",
    "ser-saathos-maris": "King's Landing",
    "ser-alester-dayne": "Bitterbridge",
    "derrin-hightower": "King's Landing",
    "cordin-poole": "King's Landing",
    "curtass-whent": "Bitterbridge",
    "jaery-targaryen": "King's Landing",
    "maela-targaryen": "King's Landing",
    "vhaemys-targaryen": "King's Landing",
    "rickard-stark": "Winterfell",
  },

  "fathers-and-their-sins": {
    "baelenys-targaryen": "King's Landing",
    "gaelor-targaryen": ["King's Landing", "Oldtown"],
    "ser-saathos-maris": ["King's Landing", "Oldtown"],
    "jacaelon-targaryen": "King's Landing",
    "maela-targaryen": ["King's Landing", "Storm's End", "King's Landing"],
    "visenor-targaryen": "Starfall",
    "rhaella-targaryen": "Starfall",
    "saera-targaryen": ["Winterfell", "King's Landing"],
    "baelor-targaryen": "King's Landing",
    "jaery-targaryen": "King's Landing",
    "lorenah-dayne": "Starfall",
    "ser-alester-dayne": "Starfall",
    "cordin-poole": "King's Landing",
    "steffon-baratheon": "Storm's End",
    "timos-hightower": "Oldtown",
    "vhaemys-targaryen": "King's Landing",
  },
  
  "a-crown-of-thorns": {
    "baelenys-targaryen": "King's Landing",
    "gaelor-targaryen": ["Oldtown", "King's Landing"],
    "ser-saathos-maris": ["Oldtown", "King's Landing"],
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
};  

export function getCharacterPositionsForChapter(
  chapterSlug: string
): Partial<Record<CharacterId, CharacterLocation>> {
  return CHAPTER_CHARACTER_POSITIONS[chapterSlug] ?? {};
}