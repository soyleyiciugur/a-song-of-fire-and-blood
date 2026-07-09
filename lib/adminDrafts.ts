// Tüm admin taslaklarını tek yerden yönetmek için ortak yardımcı fonksiyonlar

import charactersData from "../data/characters/characters.json";
import quotesData from "../data/quotes.json";
import housesData from "../data/houses.json";

const DRAFT_KEYS = {
  characters: "draft-characters",
  quotes: "draft-quotes",
  houses: "draft-houses",
} as const;

const ORIGINAL_DATA: Record<keyof typeof DRAFT_KEYS, unknown> = {
  characters: charactersData,
  quotes: quotesData,
  houses: housesData,
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
  // Layout'taki global publish bar'ın anında güncellenmesi için
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

// localStorage'daki TÜM bekleyen taslakları toplar (hangi admin sayfasında olursan ol)
export function collectAllPendingDrafts() {
  return {
    characters: getDraft("characters"),
    quotes: getDraft("quotes"),
    houses: getDraft("houses"),
  };
}

// Taslak, orijinal (canlı) veriden gerçekten farklı mı diye kontrol eder.
export function isDraftDifferentFromOriginal(draftValue: unknown, originalValue: unknown): boolean {
  if (draftValue === null || draftValue === undefined) return false;
  return JSON.stringify(draftValue) !== JSON.stringify(originalValue);
}

// GLOBAL: hangi bölümde taslak değişikliği var, tek yerden hesaplar
export function getPendingDraftStatus() {
  return {
    characters: isDraftDifferentFromOriginal(getDraft("characters"), ORIGINAL_DATA.characters),
    quotes: isDraftDifferentFromOriginal(getDraft("quotes"), ORIGINAL_DATA.quotes),
    houses: isDraftDifferentFromOriginal(getDraft("houses"), ORIGINAL_DATA.houses),
  };
}

export function hasAnyPendingDraft(): boolean {
  const status = getPendingDraftStatus();
  return status.characters || status.quotes || status.houses;
}