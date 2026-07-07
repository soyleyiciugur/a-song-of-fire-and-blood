export type House = {
  id: string;
  name: string;
  words: string;
  seat: string;
  sigilSrc: string;
  color: string;
  description: string;
};

export const houses: House[] = [
  {
    id: "targaryen",
    name: "House Targaryen",
    words: "Fire and Blood",
    seat: "King's Landing",
    sigilSrc: "/images/houses/targaryen.webp",
    color: "#8a1f1f",
    description:
      "The ruling house of the Seven Kingdoms, bound as much by dragonfire as by blood. King Baelenys' reign has grown harsher since the poisoning, and the loyalty of his own siblings and children has never been so openly tested.",
  },
  {
    id: "hightower",
    name: "House Hightower",
    words: "We Light the Way",
    seat: "Oldtown (the Hightower)",
    sigilSrc: "/images/houses/hightower.webp",
    color: "#2b4c7e",
    description:
      "Once counted among the Crown's most trusted allies through Derrin Hightower's decades as Hand. His secret treason, and the massacre that followed at Oldtown, has left the house's future in ruins.",
  },
  {
    id: "stark",
    name: "House Stark",
    words: "Winter is Coming",
    seat: "Winterfell",
    sigilSrc: "/images/houses/stark.webp",
    color: "#6b7280",
    description:
      "Wardens of the North, bound to the Iron Throne by an old, uneasy loyalty sealed in blood generations ago. Lord Brandon Stark's death brought his son Rickard to Winterfell's seat, and House Targaryen back to its gates.",
  },
  {
    id: "dayne",
    name: "House Dayne",
    words: "By the Sword, We Endure",
    seat: "Starfall",
    sigilSrc: "/images/houses/dayne.webp",
    color: "#8b7355",
    description:
      "A Dornish house quietly drawn into the heart of the realm's troubles, first through Ser Alester Dayne's sworn service to Prince Jacaelon, then through Lady Lorenah Dayne's decision to shelter a fugitive Crown Prince.",
  },
  {
    id: "velaryon",
    name: "House Velaryon",
    words: "Nothing Burns Like the Cold",
    seat: "Driftmark (High Tide)",
    sigilSrc: "/images/houses/velaryon.webp",
    color: "#1c3f5c",
    description:
      "Masters of Driftmark and the Crown's oldest maritime allies, tied now to the royal family directly through Naella Velaryon's marriage to Prince Gaelor.",
  },
  {
    id: "baratheon",
    name: "House Baratheon",
    words: "Ours Is the Fury",
    seat: "Storm's End",
    sigilSrc: "/images/houses/baratheon.webp",
    color: "#d4af37",
    description:
      "Proud stormlanders who fought beside House Targaryen in the past and expect the debt remembered. The Young Stag, Steffon Baratheon, has learned that pride alone does not move a king.",
  },
  {
    id: "vance",
    name: "House Vance",
    words: "Steady as the River",
    seat: "Unconfirmed",
    sigilSrc: "/images/houses/vance.webp",
    color: "#4a6741",
    description:
      "A lesser house known mainly through Ser Brannyn Vance's service in the Kingsguard, sworn to protect Princess Maela at any cost to himself.",
  },
  {
    id: "morrigen",
    name: "House Morrigen",
    words: "Ever Vigilant",
    seat: "The Reach",
    sigilSrc: "/images/houses/morrigen.webp",
    color: "#7a4b8a",
    description:
      "A Reach house represented at court by Ser Orwell Morrigen, Lord Commander of the Kingsguard, who watches the realm's unraveling with growing unease.",
  },
  {
    id: "lannister",
    name: "House Lannister",
    words: "Hear Me Roar!",
    seat: "Casterly Rock",
    sigilSrc: "/images/houses/lannister.webp",
    color: "#9b1c1c",
    description:
      "Represented at court by Tion Lannister, the Master of Coin, whose sound financial counsel is consistently overruled by princes eager for war.",
  },
];

export function getHouse(id: string): House | undefined {
  return houses.find((house) => house.id === id);
}
