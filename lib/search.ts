// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\lib\search.ts
import characters from "@/data/characters/characters.json";
import { chapterList } from "@/data/chapters/";
import { dragons } from "@/data/dragons";
import { houses } from "@/data/houses";
import events from "@/data/events.json";
import locations from "@/data/map/locations.json";
import cards from "@/data/the-great-game/cards.json";

export type SearchResultType = "character" | "chapter" | "house" | "dragon" | "event" | "location" | "artifact";

export type SearchResultThumbnail =
  | { kind: "character"; src: string; alt: string }
  | { kind: "house"; src: string; alt: string }
  | { kind: "dragon"; src: string; alt: string }
  | { kind: "chapter"; alt: string; number: number };

export type SearchResult = {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  keywords: string;
  thumbnail?: SearchResultThumbnail;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

let cachedIndex: SearchResult[] | null = null;

export function buildSearchIndex(): SearchResult[] {
  if (cachedIndex) return cachedIndex;

  const results: SearchResult[] = [];

  for (const character of Object.values(characters)) {
    const keywordParts = [
      character.name,
      character.nickname,
      ...(character.aliases ?? []),
      character.title,
      character.house,
      character.dragon,
    ].filter((value) => value && value !== "-");

    results.push({
      type: "character",
      id: character.id,
      title: character.name,
      subtitle:
        character.title && character.title !== "-"
          ? character.title
          : character.house,
      href: `/characters/${character.id}`,
      keywords: normalize(keywordParts.join(" ")),
      thumbnail: {
        src: `/images/miniportraits/${character.id}.webp`,
        alt: character.name,
        kind: "character",
      },
    });
  }

  chapterList.forEach((chapter, index) => {
    results.push({
      type: "chapter",
      id: chapter.slug,
      title: chapter.title,
      subtitle: chapter.synopsis,
      href: `/chapters/${chapter.slug}`,
      keywords: normalize(`${chapter.title} ${chapter.synopsis}`),
      thumbnail: {
        kind: "chapter",
        alt: chapter.title,
        number: index + 1,
      },
    });
  });

  for (const house of houses) {
    results.push({
      type: "house",
      id: house.id,
      title: house.name,
      subtitle: house.words,
      href: `/houses/${house.id}`,
      keywords: normalize(`${house.name} ${house.words}`),
      thumbnail: {
        src: house.sigilSrc,
        alt: house.name,
        kind: "house",
      },
    });
  }
  for (const dragon of dragons) {
    const rider = dragon.riderId
      ? (characters[dragon.riderId as keyof typeof characters] as
          | { name: string }
          | undefined)
      : undefined;
    const previousRider = dragon.previousRiderId
      ? (characters[dragon.previousRiderId as keyof typeof characters] as
          | { name: string }
          | undefined)
      : undefined;

    results.push({
      type: "dragon",
      id: dragon.id,
      title: dragon.name,
      subtitle: rider ? `Ridden by ${rider.name}` : "Dragon",
      href: `/dragons/${dragon.id}`,
      keywords: normalize(
        `${dragon.name} ${rider?.name ?? ""} ${previousRider?.name ?? ""} ${dragon.traits.join(" ")} ${dragon.description} dragon`
      ),
      thumbnail: {
        src: dragon.image,
        alt: dragon.name,
        kind: "dragon",
      },
    });
  }
  for (const event of events) results.push({ type: "event", id: event.id, title: event.title, subtitle: event.description, href: "/chronicle", keywords: normalize(`${event.title} ${event.description} ${event.location}`) });
  for (const location of locations) results.push({ type: "location", id: location.name, title: location.name, subtitle: "Known World location", href: `/map?location=${encodeURIComponent(location.name)}`, keywords: normalize(location.name) });
  for (const card of cards.filter((item) => item.cardType === "artifact")) results.push({ type: "artifact", id: card.id, title: card.name, subtitle: card.subtitle, href: "/artifacts", keywords: normalize(`${card.name} ${card.subtitle}`) });

  cachedIndex = results;
  return results;
}

export function searchIndex(
  query: string,
  limit = 8
): SearchResult[] {
  const q = normalize(query.trim());
  if (!q) return [];

  const index = buildSearchIndex();

  const scored = index
    .map((item) => {
      const kw = item.keywords;
      const title = normalize(item.title);

      let score = 0;

      if (kw === q) score = 100;
      else if (title.startsWith(q)) score = 90;
      else if (kw.startsWith(q)) score = 80;
      else if (kw.includes(` ${q}`)) score = 60;
      else if (kw.includes(q)) score = 40;

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.item);
}
