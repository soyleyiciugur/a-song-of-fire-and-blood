// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\lib\adminDrafts.ts
import charactersData from "../data/characters/characters.json";
import quotesData from "../data/quotes.json";
import housesData from "../data/houses.json";
import worldDateData from "../data/worldDate.json";
import scrollsData from "../data/scrolls.json";
import bookOfBrothersData from "../data/bookOfBrothers.json";
import dragonsData from "../data/dragons.json";
import timelineData from "../data/timeline.json";
import mapLocationsData from "../data/map/locations.json";
import characterPositionsData from "../data/map/character-positions.json";
import chaptersData from "../data/chapters/chapters.json";
import galleryData from "../data/gallery.json";

const DRAFT_KEYS = {
  characters: "draft-characters",
  quotes: "draft-quotes",
  houses: "draft-houses",
  worldDate: "draft-worldDate",
  scrolls: "draft-scrolls",
  bookOfBrothers: "draft-bookOfBrothers",
  dragons: "draft-dragons",
  timeline: "draft-timeline",
  mapLocations: "draft-mapLocations",
  characterPositions: "draft-characterPositions",
  chapters: "draft-chapters",
  gallery: "draft-gallery",
} as const;

const ORIGINAL_DATA: Record<keyof typeof DRAFT_KEYS, unknown> = {
  characters: charactersData,
  quotes: quotesData,
  houses: housesData,
  worldDate: worldDateData,
  scrolls: scrollsData,
  bookOfBrothers: bookOfBrothersData,
  dragons: dragonsData,
  timeline: timelineData,
  mapLocations: mapLocationsData,
  characterPositions: characterPositionsData,
  chapters: chaptersData,
  gallery: galleryData,
};

export function getDraft<T = any>(key: keyof typeof DRAFT_KEYS): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DRAFT_KEYS[key]);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setDraft(key: keyof typeof DRAFT_KEYS, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DRAFT_KEYS[key], JSON.stringify(value));
  window.dispatchEvent(new Event("admin:draft-updated"));
}

export function clearDraft(key: keyof typeof DRAFT_KEYS) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEYS[key]);
}

export function clearAllDrafts() {
  (Object.keys(DRAFT_KEYS) as (keyof typeof DRAFT_KEYS)[]).forEach((k) => clearDraft(k));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("admin:draft-updated"));
  }
}

export function collectAllPendingDrafts() {
  return {
    characters: getDraft("characters"),
    quotes: getDraft("quotes"),
    houses: getDraft("houses"),
    worldDate: getDraft("worldDate"),
    scrolls: getDraft("scrolls"),
    bookOfBrothers: getDraft("bookOfBrothers"),
    dragons: getDraft("dragons"),
    timeline: getDraft("timeline"),
    mapLocations: getDraft("mapLocations"),
    characterPositions: getDraft("characterPositions"),
    chapters: getDraft("chapters"),
    gallery: getDraft("gallery"),
  };
}

export function isDraftDifferentFromOriginal(draftValue: unknown, originalValue: unknown): boolean {
  if (draftValue === null || draftValue === undefined) return false;
  return JSON.stringify(draftValue) !== JSON.stringify(originalValue);
}

export function getPendingDraftStatus() {
  return {
    characters: isDraftDifferentFromOriginal(getDraft("characters"), ORIGINAL_DATA.characters),
    quotes: isDraftDifferentFromOriginal(getDraft("quotes"), ORIGINAL_DATA.quotes),
    houses: isDraftDifferentFromOriginal(getDraft("houses"), ORIGINAL_DATA.houses),
    worldDate: isDraftDifferentFromOriginal(getDraft("worldDate"), ORIGINAL_DATA.worldDate),
    scrolls: isDraftDifferentFromOriginal(getDraft("scrolls"), ORIGINAL_DATA.scrolls),
    bookOfBrothers: isDraftDifferentFromOriginal(getDraft("bookOfBrothers"), ORIGINAL_DATA.bookOfBrothers),
    dragons: isDraftDifferentFromOriginal(getDraft("dragons"), ORIGINAL_DATA.dragons),
    timeline: isDraftDifferentFromOriginal(getDraft("timeline"), ORIGINAL_DATA.timeline),
    mapLocations: isDraftDifferentFromOriginal(getDraft("mapLocations"), ORIGINAL_DATA.mapLocations),
    characterPositions: isDraftDifferentFromOriginal(getDraft("characterPositions"), ORIGINAL_DATA.characterPositions),
    chapters: isDraftDifferentFromOriginal(getDraft("chapters"), ORIGINAL_DATA.chapters),
    gallery: isDraftDifferentFromOriginal(getDraft("gallery"), ORIGINAL_DATA.gallery),
  };
}

export function hasAnyPendingDraft(): boolean {
  const status = getPendingDraftStatus();
  return Object.values(status).some(Boolean);
}
