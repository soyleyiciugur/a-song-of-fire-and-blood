export type TimelineEvent = {
  title: string;
  description: string;
  characters?: string[];
};

export type TimelineChapter = {
  chapterSlug: string;
  chapterTitle: string;
  events: TimelineEvent[];
};

export const timeline: TimelineChapter[] = [
  {
    chapterSlug: "the-poison-beneath-the-crown",
    chapterTitle: "Chapter I: The Poison Beneath the Crown",
    events: [
      {
        title: "The King is poisoned",
        description:
          "During the feast celebrating the hatching of the dragon eggs, King Baelenys is poisoned. The Red Keep is placed under lockdown while he clings to life.",
        characters: ["baelenys-targaryen"],
      },
      {
        title: "Three dragons hatch for one prince",
        description:
          "Prince Visenor's single egg produces three hatchlings, sparking the first open dispute between the royal siblings over who should claim them.",
        characters: ["visenor-targaryen", "jacaelon-targaryen"],
      },
      {
        title: "\"The Hand\"",
        description:
          "Gaelor tortures a confession out of the suspected poisoner, who names the Hand of the King with his dying breath before Gaelor silences him for good.",
        characters: ["gaelor-targaryen", "derrin-hightower"],
      },
      {
        title: "Rhaella's secret letter",
        description:
          "A hidden letter reveals that Rhaella has been secretly writing to her exiled family beyond the realm's borders, casting suspicion on Visenor's marriage.",
        characters: ["rhaella-targaryen", "visenor-targaryen"],
      },
    ],
  },
  {
    chapterSlug: "the-price-of-trust",
    chapterTitle: "Chapter II: The Price of Trust",
    events: [
      {
        title: "Blackfyre changes hands",
        description:
          "King Baelenys strips Blackfyre from Visenor before the entire court and gives it to Gaelor, striking his heir bloody in a fit of rage.",
        characters: ["baelenys-targaryen", "visenor-targaryen", "gaelor-targaryen"],
      },
      {
        title: "Visenor's escape",
        description:
          "Rather than kill Rhaella to regain his father's trust, Visenor flees King's Landing with her under cover of night, escorted by Ser Alester Dayne.",
        characters: ["visenor-targaryen", "rhaella-targaryen", "ser-alester-dayne"],
      },
      {
        title: "The Hand's confession",
        description:
          "Jace confronts Derrin Hightower alone at Driftmark, extracts his confession of treason with House Highgarden, and executes him in secret, hiding the body at sea.",
        characters: ["jacaelon-targaryen", "derrin-hightower"],
      },
      {
        title: "A wedding and a new Hand",
        description:
          "Gaelor marries Naella Velaryon at Driftmark, and Queen Jaery pins the Hand's badge to Jacaelon's chest before the court.",
        characters: ["gaelor-targaryen", "naella-velaryon", "jacaelon-targaryen"],
      },
    ],
  },
  {
    chapterSlug: "the-weight-of-loyalty",
    chapterTitle: "Chapter III: The Weight of Loyalty",
    events: [
      {
        title: "Ambush in the Dornish woods",
        description:
          "Curtass Whent and five hired sellswords corner Ser Alester Dayne while he escorts Visenor and Rhaella south. Alester survives; none of his attackers do.",
        characters: ["ser-alester-dayne", "curtass-whent", "visenor-targaryen"],
      },
      {
        title: "Sanctuary at Starfall",
        description:
          "Lorenah Dayne shelters the fugitive Visenor and Rhaella at Starfall, fully aware of the danger it poses to her own house.",
        characters: ["lorenah-dayne", "visenor-targaryen", "rhaella-targaryen"],
      },
      {
        title: "The Iron Bank confirms the truth",
        description:
          "A raven from Braavos confirms that the accounts financing the poisoning trace directly back to Derrin Hightower, implicating House Tyrell as well.",
        characters: ["jacaelon-targaryen", "derrin-hightower"],
      },
    ],
  },
  {
    chapterSlug: "the-broken-knight",
    chapterTitle: "Chapter IV: The Broken Knight",
    events: [
      {
        title: "Saera's visit to Winterfell",
        description:
          "Sent to offer the Crown's condolences on Lord Brandon Stark's death, Saera meets the new Lord of Winterfell, Rickard Stark, and lingers far longer than expected.",
        characters: ["saera-targaryen", "rickard-stark", "brandon-stark"],
      },
      {
        title: "The march on the Reach begins",
        description:
          "With the Iron Bank's records in hand, King Baelenys sends Gaelor to Highgarden and Oldtown to answer for the conspiracy in blood.",
        characters: ["baelenys-targaryen", "gaelor-targaryen"],
      },
    ],
  },
  {
    chapterSlug: "fathers-and-their-sins",
    chapterTitle: "Chapter V: Fathers and Their Sins",
    events: [
      {
        title: "The Oldtown Massacre",
        description:
          "Gaelor executes young Lord Timos Hightower when the boy panics and draws steel. Ser Costayne calls the Hightower banners, and the ensuing slaughter kills every Oldtown knight present, along with Timos's sister Alysanne.",
        characters: ["gaelor-targaryen", "timos-hightower", "alysanne-hightower"],
      },
      {
        title: "Maela at Storm's End",
        description:
          "Princess Maela visits Storm's End as a marriage prospect for Steffon Baratheon, but seduces her own sworn shield, Ser Brannyn Vance, instead.",
        characters: ["maela-targaryen", "steffon-baratheon", "brannyn-vance"],
      },
      {
        title: "Baelor's return",
        description:
          "Great-uncle Baelor Targaryen arrives from Oldtown's outskirts to learn the Oldtown Massacre has already happened, and rides for King's Landing in alarm.",
        characters: ["baelor-targaryen", "gaelor-targaryen"],
      },
    ],
  },
];
