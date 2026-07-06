import type { CharacterId } from "@/types/character";

/**
 * Where each character is standing during a given chapter.
 *
 * Shape: { [chapterSlug]: { [characterId]: locationName } }
 * `locationName` must match a `name` in data/map/locations.ts.
 *
 * A character with no entry for a chapter simply doesn't get a pin for
 * that chapter — nothing is guessed or carried forward automatically,
 * so the map never shows someone somewhere we're not sure about.
 *
 * STATUS OF THIS DATA:
 * - "the-poison-beneath-the-crown" is fully read and confident — the whole
 *   chapter takes place during the lockdown at King's Landing.
 * - The other four chapters are a first-pass best guess based on the
 *   clearest textual signals (the Driftmark wedding, the Oldtown battle,
 *   characters explicitly placed in a room). They're a solid starting
 *   point, but please skim through and correct/expand them — especially
 *   anyone from House Hightower in "fathers-and-their-sins", since Oldtown
 *   is their seat and the text doesn't spell out exactly who's where
 *   during that fight.
 */
export const CHAPTER_CHARACTER_POSITIONS: Record<
  string,
  Partial<Record<CharacterId, string>>
> = {
  "the-poison-beneath-the-crown": {
    "baelenys-targaryen": "King's Landing",
    "visenor-targaryen": "King's Landing",
    "jacaelon-targaryen": "King's Landing",
    "saera-targaryen": "King's Landing",
    "gaelor-targaryen": "King's Landing",
    "rhaella-targaryen": "King's Landing",
    "ser-saathos-maris": "King's Landing",
  },

  "the-price-of-trust": {
    "baelenys-targaryen": "King's Landing",
    "visenor-targaryen": "King's Landing",
    "jacaelon-targaryen": "King's Landing",
    "saera-targaryen": "King's Landing",
    "gaelor-targaryen": "King's Landing",
    "rhaella-targaryen": "King's Landing",
    "ser-saathos-maris": "King's Landing",
    "ser-alester-dayne": "King's Landing",
    "derrin-hightower": "King's Landing",
    "lorenah-dayne": "King's Landing",
    "vhaemys-targaryen": "King's Landing",
  },

  "the-weight-of-loyalty": {
    // Wedding party at Driftmark:
    "gaelor-targaryen": "Driftmark",
    "naella-velaryon": "Driftmark",
    "jacaelon-targaryen": "Driftmark",
    "derrin-hightower": "Driftmark",
    // Stayed at the capital:
    "baelenys-targaryen": "King's Landing",
    "visenor-targaryen": "King's Landing",
    "saera-targaryen": "King's Landing",
    "rhaella-targaryen": "King's Landing",
    "ser-saathos-maris": "King's Landing",
    "ser-alester-dayne": "King's Landing",
    "curtass-whent": "King's Landing",
    "vhaemys-targaryen": "King's Landing",
    "jaery-targaryen": "King's Landing",
  },

  "the-broken-knight": {
    "jacaelon-targaryen": "King's Landing",
    "gaelor-targaryen": "King's Landing",
    "baelor-targaryen": "King's Landing",
    "visenor-targaryen": "King's Landing",
    "saera-targaryen": "King's Landing",
    "rhaella-targaryen": "King's Landing",
    "ser-saathos-maris": "King's Landing",
    "ser-alester-dayne": "King's Landing",
    "derrin-hightower": "King's Landing",
    "cordin-poole": "King's Landing",
    "curtass-whent": "King's Landing",
    "jaery-targaryen": "King's Landing",
    "maela-targaryen": "King's Landing",
    "vhaemys-targaryen": "King's Landing",
    "rickard-stark": "Winterfell",
  },

  "fathers-and-their-sins": {
    // The vanguard that rode on Oldtown:
    "gaelor-targaryen": "Oldtown",
    "ser-saathos-maris": "Oldtown",
    // Back at the capital:
    "jacaelon-targaryen": "King's Landing",
    "maela-targaryen": "King's Landing",
    "visenor-targaryen": "King's Landing",
    "rhaella-targaryen": "King's Landing",
    "saera-targaryen": "King's Landing",
    "baelor-targaryen": "King's Landing",
    "jaery-targaryen": "King's Landing",
    "lorenah-dayne": "King's Landing",
    "ser-alester-dayne": "King's Landing",
    "cordin-poole": "King's Landing",
    "steffon-baratheon": "Storm's End",
    "timos-hightower": "Oldtown",
    "derrin-hightower": "Oldtown",
    "vhaemys-targaryen": "King's Landing",
  },
};

export function getCharacterPositionsForChapter(
  chapterSlug: string
): Partial<Record<CharacterId, string>> {
  return CHAPTER_CHARACTER_POSITIONS[chapterSlug] ?? {};
}
