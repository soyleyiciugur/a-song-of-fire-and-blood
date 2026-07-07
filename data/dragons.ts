export type DragonStatus = "Alive" | "Dead";

export type Dragon = {
  id: string;
  name: string;
  status: DragonStatus;
  riderId?: string;
  previousRiderId?: string;
  image: string;
  traits: string[];
  description: string;
};

export const dragons: Dragon[] = [
  {
    id: "maelwing",
    name: "Maelwing",
    status: "Alive",
    riderId: "baelenys-targaryen",
    image: "/images/dragons/maelwing.webp",
    traits: [
      "Ancient",
      "Battle-Scarred",
      "Fiercely Loyal to Baelenys",
      "Rarely Flown Beyond the Capital",
    ],
    description:
      "King Baelenys' dragon, ridden since long before his own coronation and as feared throughout the realm as the king himself.",
  },
  {
    id: "jhagar",
    name: "Jhagar",
    status: "Alive",
    riderId: "jacaelon-targaryen",
    image: "/images/dragons/jhagar.webp",
    traits: [
      "Disciplined",
      "Watchful",
      "Reluctant Flyer",
      "Bonded Young",
    ],
    description:
      "Bonded to Prince Jacaelon. Rarely flown for pleasure — Jace treats him more as an instrument of state than a companion.",
  },
  {
    id: "cloudgazer",
    name: "Cloudgazer",
    status: "Alive",
    riderId: "saera-targaryen",
    image: "/images/dragons/cloudgazer.webp",
    traits: [
      "Storm-Grey Scales",
      "Unusually Gentle",
      "Swift",
      "Prefers High Altitude",
    ],
    description:
      "Princess Saera's dragon, storm-grey and unusually gentle. She retreats to his back whenever the Red Keep grows too loud.",
  },
  {
    id: "bayle",
    name: "Bayle",
    status: "Alive",
    riderId: "gaelor-targaryen",
    image: "/images/dragons/bayle.webp",
    traits: [
      "Aggressive in Battle",
      "Restless on the Ground",
      "Flown into the Reach",
      "Young and Reckless",
    ],
    description:
      "Prince Gaelor's dragon, flown into the Reach during the campaign that ended in the Oldtown Massacre.",
  },
  {
    id: "jadefyre",
    name: "Jadefyre",
    status: "Alive",
    riderId: "maela-targaryen",
    previousRiderId: "visenor-targaryen",
    image: "/images/dragons/jadefyre.webp",
    traits: [
      "Jade-Green Scales",
      "Small for Its Age",
      "Survivor",
      "Newly Bonded",
    ],
    description:
      "Hatched in Visenor's clutch of three and named by him before his flight from King's Landing. The sole hatchling to survive, Jadefyre was gifted to Maela by royal decree after Visenor's disappearance.",
  },
  {
    id: "visenors-first-hatchling",
    name: "Unnamed hatchling",
    status: "Dead",
    previousRiderId: "visenor-targaryen",
    image: "/images/dragons/hatchling-lost.webp",
    traits: ["Malformed Wings", "Died Within Days", "Never Flew"],
    description:
      "One of two hatchlings from Visenor's clutch of three. Died of grotesque birth defects within days of hatching, never named.",
  },
  {
    id: "visenors-second-hatchling",
    name: "Unnamed hatchling",
    status: "Dead",
    previousRiderId: "visenor-targaryen",
    image: "/images/dragons/hatchling-lost.webp",
    traits: ["Twisted Growth", "Died Within Days", "Never Flew"],
    description:
      "The second of two hatchlings from Visenor's clutch of three to die of grotesque birth defects, leaving only Jadefyre alive.",
  },
];

export function getDragon(id: string): Dragon | undefined {
  return dragons.find((dragon) => dragon.id === id);
}
