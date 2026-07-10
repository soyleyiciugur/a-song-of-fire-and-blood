export type TimelineEvent = {
  title: string;
  description: string;
  date?: string;
  characters?: string[];
};

export type TimelineChapter = {
  chapterSlug: string;
  chapterTitle: string;
  date?: string;
  events: TimelineEvent[];
};

export const timeline: TimelineChapter[] = [
  {
    chapterSlug: "the-poison-beneath-the-crown",
    chapterTitle: "Chapter I: The Poison Beneath the Crown",
    date: "Mid 2nd Moon, 99 AC",
    events: [
      {
        title: "The King is poisoned",
        date: "16th of the 2nd Moon",
        description:
          "During the feast celebrating the hatching of the dragon eggs, King Baelenys is poisoned. The Red Keep is placed under lockdown while he clings to life.",
        characters: ["baelenys-targaryen"],
      },
      {
        title: "Three dragons hatch for one prince",
        date: "16th of the 2nd Moon",
        description:
          "Prince Visenor's single egg produces three hatchlings, sparking the first open dispute between the royal siblings over who should claim them.",
        characters: ["visenor-targaryen", "jacaelon-targaryen"],
      },
      {
        title: '"The Hand"',
        date: "18th–19th of the 2nd Moon",
        description:
          "Gaelor tortures a confession out of the suspected poisoner, who names the Hand of the King with his dying breath before Gaelor silences him for good.",
        characters: ["gaelor-targaryen", "derrin-hightower"],
      },
      {
        title: "Rhaella's secret letter",
        date: "18th–19th of the 2nd Moon",
        description:
          "A hidden letter reveals that Rhaella has been secretly writing to her exiled family beyond the realm's borders, casting suspicion on Visenor's marriage.",
        characters: ["rhaella-targaryen", "visenor-targaryen"],
      },
    ],
  },
  {
    chapterSlug: "the-price-of-trust",
    chapterTitle: "Chapter II: The Price of Trust",
    date: "Late 2nd Moon, 99 AC",
    events: [
      {
        title: "Blackfyre changes hands",
        date: "20th of the 2nd Moon",
        description:
          "King Baelenys strips Blackfyre from Visenor before the entire court and gives it to Gaelor, striking his heir bloody in a fit of rage.",
        characters: ["baelenys-targaryen", "visenor-targaryen", "gaelor-targaryen"],
      },
      {
        title: "Visenor's escape",
        date: "20th of the 2nd Moon",
        description:
          "Rather than kill Rhaella to regain his father's trust, Visenor flees King's Landing with her under cover of night, escorted by Ser Alester Dayne.",
        characters: ["visenor-targaryen", "rhaella-targaryen", "ser-alester-dayne"],
      },
      {
        title: "The Hand's confession",
        date: "Late 2nd Moon",
        description:
          "Jace confronts Derrin Hightower alone at Driftmark, extracts his confession of treason with House Highgarden, and executes him in secret, hiding the body at sea.",
        characters: ["jacaelon-targaryen", "derrin-hightower"],
      },
      {
        title: "A wedding and a new Hand",
        date: "Late 2nd Moon",
        description:
          "Gaelor marries Naella Velaryon at Driftmark, and Queen Jaery pins the Hand's badge to Jacaelon's chest before the court.",
        characters: ["gaelor-targaryen", "naella-velaryon", "jacaelon-targaryen"],
      },
    ],
  },
  {
    chapterSlug: "the-weight-of-loyalty",
    chapterTitle: "Chapter III: The Weight of Loyalty",
    date: "Early 3rd Moon, 99 AC",
    events: [
      {
        title: "The Iron Bank confirms the truth",
        date: "Early 3rd Moon",
        description:
          "A raven from Braavos confirms that the accounts financing the poisoning trace directly back to Derrin Hightower, implicating House Tyrell as well.",
        characters: ["jacaelon-targaryen", "derrin-hightower"],
      },
      {
        title: "Ambush in the Dornish woods",
        date: "Early 3rd Moon",
        description:
          "Curtass Whent and five hired sellswords corner Ser Alester Dayne while he escorts Visenor and Rhaella south. Alester survives; none of his attackers do.",
        characters: ["ser-alester-dayne", "curtass-whent", "visenor-targaryen"],
      },
      {
        title: "Sanctuary at Starfall",
        date: "Early 3rd Moon",
        description:
          "Lorenah Dayne shelters the fugitive Visenor and Rhaella at Starfall, fully aware of the danger it poses to her own house.",
        characters: ["lorenah-dayne", "visenor-targaryen", "rhaella-targaryen"],
      },
    ],
  },
  {
    chapterSlug: "the-broken-knight",
    chapterTitle: "Chapter IV: The Broken Knight",
    date: "3rd Moon - 4th Moon, 99 AC",
    events: [
      {
        title: "The march on the Reach begins",
        date: "Early 3rd Moon",
        description:
          "With the Iron Bank's records in hand, King Baelenys sends Gaelor to Highgarden and Oldtown to answer for the conspiracy in blood. The army departs King's Landing.",
        characters: ["baelenys-targaryen", "gaelor-targaryen"],
      },
      {
        title: "Saera's visit to Winterfell",
        date: "Late 4th Moon",
        description:
          "Sent to offer the Crown's condolences on Lord Brandon Stark's death, Saera meets the new Lord of Winterfell, Rickard Stark, and lingers far longer than expected.",
        characters: ["saera-targaryen", "rickard-stark", "brandon-stark"],
      },
    ],
  },
  {
    chapterSlug: "fathers-and-their-sins",
    chapterTitle: "Chapter V: Fathers and Their Sins",
    date: "Early 5th Moon - Late 6th Moon, 99 AC",
    events: [
      {
        title: "The Oldtown Massacre",
        date: "Early 5th Moon",
        description:
          "After a two-month march, Gaelor executes young Lord Timos Hightower when the boy panics and draws steel. Ser Costayne calls the Hightower banners, and the ensuing slaughter kills every Oldtown knight present, along with Timos's sister Alysanne.",
        characters: ["gaelor-targaryen", "timos-hightower", "alysanne-hightower"],
      },
      {
        title: "Maela at Storm's End",
        date: "Early 6th Moon",
        description:
          "Princess Maela visits Storm's End as a marriage prospect for Steffon Baratheon, but seduces her own sworn shield, Ser Brannyn Vance, instead.",
        characters: ["maela-targaryen", "steffon-baratheon", "ser-brannyn-vance"],
      },
      {
        title: "Baelor's return",
        date: "Late 6th Moon",
        description:
          "Uncle Baelor Targaryen arrives from Oldtown's outskirts to learn the Oldtown Massacre has already happened, and rides for King's Landing in alarm.",
        characters: ["baelor-targaryen", "gaelor-targaryen"],
      },
    ],
  },
  {
    chapterSlug: "a-crown-of-thorns",
    chapterTitle: "Chapter VI: A Crown of Thorns",
    date: "Early 7th Moon, 99 AC",
    events: [
      {
        title: "The family fractures",
        date: "Early 7th Moon",
        description:
          "News of Alysanne Hightower's death alongside Timos reaches King's Landing as Gaelor's host returns. Saera confronts King Baelenys, and a drunken Baelenys draws Blackfyre on Jace and Gaelor before Vhaemys's plea breaks the standoff.",
        characters: ["baelenys-targaryen", "saera-targaryen", "jacaelon-targaryen", "gaelor-targaryen", "vhaemys-targaryen"],
      },
      {
        title: "Baelor named Grand Maester",
        date: "Early 7th Moon",
        description:
          "King Baelenys elevates his uncle Baelor to Grand Maester in place of Cordin, though the two clash immediately over the King's handling of the Oldtown Massacre.",
        characters: ["baelor-targaryen", "baelenys-targaryen", "cordin-poole"],
      },
      {
        title: "Rhaella's pregnancy and the legend of Boneskin",
        date: "Early 7th Moon",
        description:
          "Hidden at a Dornish scholars' retreat outside Starfall, Visenor learns Rhaella is with child and discovers old letters referencing a reclusive, unusually intelligent dragon named Boneskin roosting in the Red Mountains.",
        characters: ["visenor-targaryen", "rhaella-targaryen"],
      },
      {
        title: "Lady Dayne's envoy reaches King's Landing",
        date: "3rd of the 7th Moon",
        description:
          "Lady Lorenah Dayne's diplomatic envoy arrives at the Red Keep with a battered Ser Alester, who kneels in silent loyalty before Jace in the castle yard.",
        characters: ["lorenah-dayne", "ser-alester-dayne", "jacaelon-targaryen"],
      },
    ],
  },
  {
    chapterSlug: "the-climb-and-the-kneel",
    chapterTitle: "Chapter VII: The Climb and the Kneel",
    date: "Early 7th Moon, 99 AC",
    events: [
      {
        title: "Curtass Whent confirmed dead",
        date: "3rd of the 7th Moon",
        description:
          "Word reaches King's Landing that Ser Curtass Whent died in the Dornish woods carrying out the King's order to retrieve Visenor. King Baelenys shows only indifference.",
        characters: ["baelenys-targaryen", "curtass-whent"],
      },
      {
        title: "A night in Flea Bottom",
        date: "3rd of the 7th Moon",
        description:
          "Jace and Lady Lorenah Dayne slip into Flea Bottom in disguise, wandering the city together for an evening away from court.",
        characters: ["jacaelon-targaryen", "lorenah-dayne"],
      },
      {
        title: "Jace is knighted",
        date: "3rd of the 7th Moon",
        description:
          "In private, with no court or ceremony, Ser Alester Dayne knights Jace, fulfilling a vow only the two of them witness.",
        characters: ["jacaelon-targaryen", "ser-alester-dayne"],
      },
      {
        title: "Naella's pregnancy",
        date: "3rd of the 7th Moon",
        description:
          "Naella Velaryon tells Gaelor she is with child; King Baelenys receives the news with rare, genuine warmth.",
        characters: ["naella-velaryon", "gaelor-targaryen", "baelenys-targaryen"],
      },
      {
        title: "Visenor tames Boneskin",
        date: "3rd–7th of the 7th Moon",
        description:
          "Disguised and traveling alone from Starfall, Visenor climbs into the Red Mountains, tracks down the wild dragon Boneskin, and, after days of patient contact, wins the beast's trust.",
        characters: ["visenor-targaryen"],
      },
    ],
  },
];