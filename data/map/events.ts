import type { MapEvent } from "@/types/map";

// Starter set — grounded in what's explicitly on the page for each chapter.
// This is deliberately conservative: only events the chapter text actually
// describes happening (not ones merely discussed/planned) are included.
// Add more here as new chapters are written; `location` must match a name
// in data/map/locations.ts and `chapterSlug` a slug in data/chapters.
export const MAP_EVENTS: MapEvent[] = [
  {
    id: "feast-dragon-hatching",
    title: "The Dragon-Hatching Feast",
    type: "feast",
    location: "King's Landing",
    chapterSlug: "the-poison-beneath-the-crown",
    description:
      "A royal feast to celebrate the hatching of dragon eggs, ended by King Baelenys collapsing from poison and the Red Keep locked down in suspicion.",
  },
  {
    id: "wedding-driftmark",
    title: "Wedding at Driftmark",
    type: "wedding",
    location: "Driftmark",
    chapterSlug: "the-weight-of-loyalty",
    description:
      "The Velaryon seat of High Tide hosts a grand wedding, drawing half the nobility of the eastern coast to Driftmark's harbor.",
  },
  {
    id: "battle-oldtown",
    title: "The Massacre at Oldtown",
    type: "battle",
    location: "Oldtown",
    chapterSlug: "fathers-and-their-sins",
    description:
      "Prince Gaelor's vanguard clashes with Oldtown's knights in the castle courtyard — a slaughter the Citadel and the Reach will remember for a hundred years.",
  },
];

export function getEventsForChapter(chapterSlug: string): MapEvent[] {
  return MAP_EVENTS.filter((e) => e.chapterSlug === chapterSlug);
}
