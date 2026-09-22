import characters from "@/data/characters/characters.json";
import { chapterList } from "@/data/chapters/";
import { dragons } from "@/data/dragons";
import { houses } from "@/data/houses";
import events from "@/data/events.json";
import locations from "@/data/map/locations.json";
import { artifacts } from "@/data/artifacts";
import cards from "@/data/the-great-game/cards.json";
import gallery from "@/data/gallery.json";
import quotes from "@/data/quotes.json";
import scrolls from "@/data/scrolls.json";
import brothers from "@/data/bookOfBrothers.json";
import bloodshed from "@/data/bloodshed.json";
import forum from "@/data/forum.json";
import updateNotes from "@/data/update-notes.json";
import { beastTypes } from "@/data/bestiary";
import { FLAT_NAV_ITEMS } from "@/constants/navigation";
import { isMapEventType } from "@/types/map";

export type SearchResultType =
  | "character" | "chapter" | "house" | "dragon" | "event" | "location"
  | "artifact" | "gallery" | "quote" | "scroll" | "brother" | "bloodshed"
  | "forum" | "bestiary" | "card" | "page" | "update";

export const SEARCH_TYPE_LABELS: Record<SearchResultType, string> = {
  character: "Characters", chapter: "Chapters", house: "Houses", dragon: "Dragons",
  event: "Events", location: "Locations", artifact: "Artifacts", gallery: "Raven's Eye",
  quote: "Quotes", scroll: "Scrolls", brother: "Book of Brothers", bloodshed: "The Bloodshed",
  forum: "Taverns", bestiary: "Bestiary", update: "Update Notes",
  card: "The Great Game", page: "Destinations",
};

export const SEARCH_TYPE_ORDER = Object.keys(SEARCH_TYPE_LABELS) as SearchResultType[];

export type SearchResultThumbnail =
  | { kind: "character"; src: string; alt: string }
  | { kind: "house"; src: string; alt: string }
  | { kind: "dragon" | "image"; src: string; alt: string }
  | { kind: "chapter"; alt: string; number: number };

export type SearchResult = {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  keywords: string;
  thumbnail?: SearchResultThumbnail;
  iconVariant?: string;
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function text(...parts: unknown[]) {
  return normalize(parts.flat(Infinity).filter(Boolean).join(" "));
}

function relationshipText(
  relationships: Partial<
    Record<string, { overview: string; latestDevelopment: string }>
  >
) {
  return Object.values(relationships).flatMap((relationship) =>
    relationship
      ? [relationship.overview, relationship.latestDevelopment]
      : []
  );
}

function ravenHref(entry: (typeof gallery)[number]) {
  const source = entry.src.toLowerCase();
  const base = /\.(mp4|webm|mov)(?:[?#]|$)/.test(source)
    ? "/ravens-eye/reels"
    : entry.category === "fleabottom" ? "/ravens-eye/memes" : "/ravens-eye";
  return `${base}?item=${encodeURIComponent(entry.id)}`;
}

let cachedIndex: SearchResult[] | null = null;

export function buildSearchIndex(): SearchResult[] {
  if (cachedIndex) return cachedIndex;
  const results: SearchResult[] = [];

  for (const character of Object.values(characters)) {
    if (character.hidden) continue;
    const keywordParts = [character.name, character.nickname, ...(character.aliases ?? []), character.title, character.house, character.dragon];
    results.push({ type: "character", id: character.id, title: character.name,
      subtitle: character.title && character.title !== "-" ? character.title : character.house,
      href: `/characters/${character.id}`,
      keywords: text(keywordParts, character.status, character.traits, character.goals, character.summary, character.quotes, relationshipText(character.relationships), character.death),
      thumbnail: { src: `/images/miniportraits/${character.id}.webp`, alt: character.name, kind: "character" } });
  }

  chapterList.forEach((chapter, index) => results.push({ type: "chapter", id: chapter.slug,
    title: chapter.title, subtitle: chapter.synopsis, href: `/chapters/${chapter.slug}`,
    keywords: text(chapter.title, chapter.synopsis, chapter.content, chapter.titleTr, chapter.synopsisTr, chapter.contentTr),
    thumbnail: { kind: "chapter", alt: chapter.title, number: index + 1 } }));

  for (const house of houses) results.push({ type: "house", id: house.id, title: house.name,
    subtitle: house.words, href: `/houses/${house.id}`, keywords: text(house.name, house.words),
    thumbnail: { src: house.sigilSrc, alt: house.name, kind: "house" } });

  for (const dragon of dragons) {
    const rider = dragon.riderId ? characters[dragon.riderId as keyof typeof characters] as { name: string } | undefined : undefined;
    const previous = dragon.previousRiderId ? characters[dragon.previousRiderId as keyof typeof characters] as { name: string } | undefined : undefined;
    results.push({ type: "dragon", id: dragon.id, title: dragon.name,
      subtitle: rider ? `Ridden by ${rider.name}` : "Dragon", href: `/dragons/${dragon.id}`,
      keywords: text(dragon.name, rider?.name, previous?.name, dragon.traits, dragon.description, "dragon"),
      thumbnail: { src: `/images/miniportraits/dragons/${dragon.id}.webp`, alt: dragon.name, kind: "dragon" } });
  }

  for (const event of events) results.push({ type: "event", id: event.id, title: event.title,
    subtitle: event.description,
    href: isMapEventType(event.type) ? `/chronicle#${encodeURIComponent(event.id)}` : `/chapters/${event.chapterSlug}`,
    keywords: text(event.title, event.description, event.location), iconVariant: event.type });
  for (const location of locations) results.push({ type: "location", id: location.name, title: location.name,
    subtitle: "Known World location", href: `/map?location=${encodeURIComponent(location.name)}`, keywords: text(location.name) });
  for (const [id, name, description] of artifacts) results.push({ type: "artifact", id,
    title: name, subtitle: description, href: `/artifacts#${id}`, keywords: text(name, description) });

  gallery.forEach((entry) => {
    const isVideo = /\.(mp4|webm|mov)(?:[?#]|$)/i.test(entry.src);
    const poster = entry.src.replace(/^.*\/([^/]+)\.[^.]+$/, "/videos/reels/posters/$1.webp");
    results.push({ type: "gallery", id: entry.id, title: entry.caption || (isVideo ? "Raven's Eye reel" : "Raven's Eye image"),
      subtitle: isVideo ? "Reel" : entry.category === "fleabottom" ? "Gutter Meme" : "Raven's Eye",
      href: ravenHref(entry), keywords: text(entry.caption, entry.characterIds, entry.houseIds, entry.dragonIds, entry.chapterId),
      thumbnail: { kind: "image", src: isVideo ? poster : entry.src, alt: entry.caption || "Raven's Eye media" } });
  });

  quotes.forEach((quote, index) => results.push({ type: "quote", id: `quote-${index}`,
    title: `“${quote.text}”`, subtitle: quote.speakerName, href: "/quotes",
    keywords: text(quote.text, quote.speakerName, quote.chapterTitle, quote.note) }));
  for (const scroll of scrolls) results.push({ type: "scroll", id: scroll.id, title: scroll.title,
    subtitle: `${scroll.author} · ${scroll.category}`, href: `/scrolls/${scroll.id}`,
    keywords: text(scroll.title, scroll.author, scroll.authorTitle, scroll.category, scroll.summary, scroll.content) });
  for (const brother of brothers.filter((entry) => entry.published)) {
    const character = brother.characterId ? characters[brother.characterId as keyof typeof characters] as { name: string; title?: string } | undefined : undefined;
    const name = brother.manualName ?? character?.name ?? brother.id;
    const title = brother.manualTitle ?? character?.title;
    results.push({ type: "brother", id: brother.id, title: name, subtitle: title,
      href: `/book-of-brothers/${brother.id}`,
      keywords: text(name, title, brother.oath, brother.deeds.map((deed) => deed.description), brother.notes) });
  }
  for (const entry of bloodshed) results.push({ type: "bloodshed", id: entry.id, title: entry.title,
    subtitle: `${entry.kind} · ${entry.location}`, href: `/wars?event=${encodeURIComponent(entry.id)}`,
    keywords: text(entry.title, entry.kind, entry.location, entry.summary, entry.cause, entry.consequence) });
  for (const thread of forum.threads) results.push({ type: "forum", id: thread.id,
    title: thread.title || thread.body.split("\n")[0], subtitle: thread.category,
    href: `/forum?thread=${encodeURIComponent(thread.id)}`, keywords: text(thread.title, thread.body, thread.category) });
  for (const beast of beastTypes) results.push({ type: "bestiary", id: beast.id, title: beast.name,
    subtitle: beast.description, href: `/bestiary/${beast.id}`, keywords: text(beast.name, beast.description) });
  for (const card of cards.filter((entry) => entry.cardType !== "artifact")) results.push({ type: "card", id: card.id,
    title: card.name, subtitle: `The Great Game · ${card.cardType}`,
    href: "/cards", keywords: text(card.name, card.cardType, card.traits, card.abilities, card.roles) });
  const destinations = [
    ...FLAT_NAV_ITEMS,
    { label: "The Raven's Eye", href: "/ravens-eye" }, { label: "Taverns", href: "/forum" },
    { label: "The Great Game", href: "/cards" }, { label: "The Workbench", href: "/workbench" },
    { label: "Update Notes", href: "/update-notes" },
  ];
  for (const destination of destinations.filter((entry, index, all) => all.findIndex((item) => item.href === entry.href) === index)) {
    results.push({ type: "page", id: destination.href, title: destination.label,
      subtitle: "Site destination", href: destination.href, keywords: text(destination.label, destination.href.replaceAll("/", " ")) });
  }
  for (const note of updateNotes) results.push({ type: "update", id: note.date, title: note.date,
    subtitle: note.items[0], href: "/update-notes", keywords: text(note.date, note.items) });

  cachedIndex = results;
  return results;
}

function scoreResult(item: SearchResult, query: string) {
  const title = normalize(item.title);
  const tokens = query.split(/\s+/).filter(Boolean);
  if (!tokens.every((token) => item.keywords.includes(token))) return 0;
  if (title === query) return 120;
  if (title.startsWith(query)) return 105;
  if (item.keywords.startsWith(query)) return 90;
  if (item.keywords.includes(` ${query}`)) return 80;
  if (item.keywords.includes(query)) return 70;
  return 40 + tokens.filter((token) => title.includes(token)).length * 8;
}

export function searchIndex(query: string, limit = Number.POSITIVE_INFINITY, type?: SearchResultType): SearchResult[] {
  const q = normalize(query.trim());
  if (!q) return [];
  return buildSearchIndex().filter((item) => !type || item.type === type)
    .map((item, position) => ({ item, position, score: scoreResult(item, q) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.position - b.position)
    .slice(0, limit).map((entry) => entry.item);
}

export function balancedSearchIndex(query: string, limit = 12): SearchResult[] {
  const matches = searchIndex(query);
  const buckets = new Map<SearchResultType, SearchResult[]>();
  for (const match of matches) buckets.set(match.type, [...(buckets.get(match.type) ?? []), match]);
  const balanced: SearchResult[] = [];
  while (balanced.length < limit) {
    let added = false;
    for (const type of SEARCH_TYPE_ORDER) {
      const item = buckets.get(type)?.shift();
      if (item) { balanced.push(item); added = true; }
      if (balanced.length === limit) break;
    }
    if (!added) break;
  }
  return balanced;
}
