import type { CharacterId, CharacterQuote } from "@/types/character";

export const quotes: CharacterQuote[] = [
  {
    text: "I trusted you. I did not love you. Love is for mothers and fools. I trusted you.",
    speakerId: "baelenys-targaryen",
    speakerName: "Baelenys Targaryen",
    chapterSlug: "the-price-of-trust",
    chapterTitle: "Chapter II: The Price of Trust",
  },
  {
    text: "The Iron Bank leaves records where men leave lies.",
    speakerId: "baelenys-targaryen",
    speakerName: "Baelenys Targaryen",
    chapterSlug: "the-weight-of-loyalty",
    chapterTitle: "Chapter III: The Weight of Loyalty",
  },
  {
    text: "Did I not tell you to stop questioning things?",
    speakerId: "jacaelon-targaryen",
    speakerName: "Jacaelon Targaryen",
    chapterSlug: "the-broken-knight",
    chapterTitle: "Chapter IV: The Broken Knight",
  },
  {
    text: "Flowers and bugs cannot stand against dragons.",
    speakerId: "jacaelon-targaryen",
    speakerName: "Jacaelon Targaryen",
    chapterSlug: "the-broken-knight",
    chapterTitle: "Chapter IV: The Broken Knight",
  },
  {
    text: "You truly were a loyal Hand... until you weren't.",
    speakerId: "jacaelon-targaryen",
    speakerName: "Jacaelon Targaryen",
    chapterSlug: "the-weight-of-loyalty",
    chapterTitle: "Chapter III: The Weight of Loyalty",
  },
  {
    text: "The King does not serve. The King grants. You serve.",
    speakerId: "jacaelon-targaryen",
    speakerName: "Jacaelon Targaryen",
    chapterSlug: "the-broken-knight",
    chapterTitle: "Chapter IV: The Broken Knight",
  },
  {
    text: "Stags are merely meals for dragons, Maela.",
    speakerId: "jacaelon-targaryen",
    speakerName: "Jacaelon Targaryen",
    chapterSlug: "fathers-and-their-sins",
    chapterTitle: "Chapter V: Fathers and Their Sins",
  },
  {
    text: "Tell me, Maester Cordin, will there ever be a moment at this table where you offer a thought of your own?",
    speakerId: "jacaelon-targaryen",
    speakerName: "Jacaelon Targaryen",
    chapterSlug: "the-broken-knight",
    chapterTitle: "Chapter IV: The Broken Knight",
  },
  {
    text: "I just need to sleep.",
    speakerId: "rhaella-targaryen",
    speakerName: "Rhaella Targaryen",
    chapterSlug: "the-weight-of-loyalty",
    chapterTitle: "Chapter II: The Weight of Loyalty",
  },
  {
    text: "A Baratheon kneels when he feels safe.",
    speakerId: "steffon-baratheon",
    speakerName: "Steffon Baratheon",
    chapterSlug: "the-broken-knight",
    chapterTitle: "Chapter IV: The Broken Knight",
  },
  {
    text: "You know what the problem with the Kingsguard is? They pass over fixers—real men like me—and hire prancing pretty boys who spend their mornings brushing their hair.",
    speakerId: "curtass-whent",
    speakerName: "Curtass Whent",
    chapterSlug: "the-broken-knight",
    chapterTitle: "Chapter IV: The Broken Knight",
  },
  {
    text: "Make one more out-of-place joke, Saathos, and I'll cut off your little Saathos and hand it to you.",
    speakerId: "gaelor-targaryen",
    speakerName: "Gaelor Targaryen",
    chapterSlug: "fathers-and-their-sins",
    chapterTitle: "Chapter V: Fathers and Their Sins",
  },
  {
    text: "Your body is [here]. The rest of you left this hall hours ago.",
    speakerId: "saera-targaryen",
    speakerName: "Saera Targaryen",
    chapterSlug: "the-weight-of-loyalty",
    chapterTitle: "Chapter III: The Weight of Loyalty",
  },
  {
    text: "My king, will you punish years of loyal service for the deeds of one stranger?",
    speakerId: "saera-targaryen",
    speakerName: "Saera Targaryen",
    chapterSlug: "the-poison-beneath-the-crown",
    chapterTitle: "Chapter I: The Poison Beneath the Crown"
  },
  {
    text: "Next time, remember who it is you dare disappoint.",
    speakerId: "baelenys-targaryen",
    speakerName: "Baelenys Targaryen",
    chapterSlug: "the-price-of-trust",
    chapterTitle: "Chapter II: The Price of Trust"
  },
  {
    text: "Love alone cannot preserve a dynasty.",
    speakerId: "derrin-hightower",
    speakerName: "Derrin Hightower",
    chapterSlug: "the-weight-of-loyalty",
    chapterTitle: "Chapter III: The Weight of Loyalty"
  },
  {
    text: "Sons must pay the price for their fathers' ambitions.",
    speakerId: "cordin-poole",
    speakerName: "Cordin Poole",
    chapterSlug: "the-broken-knight",
    chapterTitle: "Chapter IV: The Broken Knight"
  },
  {
    text: "Anyway, trust is more important than love.",
    speakerId: "vhaemys-targaryen",
    speakerName: "Vhaemys Targaryen",
    chapterSlug: "the-broken-knight",
    chapterTitle: "Chapter IV: The Broken Knight"
  },
  {
    text: "Gaelor and Baelor, eh?",
    speakerId: "baelor-targaryen",
    speakerName: "Baelor Targaryen",
    chapterSlug: "fathers-and-their-sins",
    chapterTitle: "Chapter V: Fathers and Their Sins"
  },
  {
    text: "No one turns their back on me and my family.",
    speakerId: "baelenys-targaryen",
    speakerName: "Baelenys Targaryen",
    chapterSlug: "the-broken-knight",
    chapterTitle: "Chapter IV: The Broken Knight"
  },
  {
    text: "Knights of Oldtown! Your Lord was murdered under a banner of peace! Kill Gaelor! Kill them all!",
    speakerId: "ser-brant-costayne",
    speakerName: "Ser Brant Costayne",
    chapterSlug: "fathers-and-their-sins",
    chapterTitle: "Chapter V: Fathers and Their Sins"
  }
]

export function getQuotesByCharacterId(id: CharacterId): CharacterQuote[] {
  return quotes.filter((quote) => quote.speakerId === id);
}
