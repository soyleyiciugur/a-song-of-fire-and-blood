// Tüm admin taslaklarını tek yerden yönetmek için ortak yardımcı fonksiyonlar

const DRAFT_KEYS = {
  characters: "draft-characters",
  quotes: "draft-quotes",
  houses: "draft-houses",
} as const;

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
}

export function clearDraft(key: keyof typeof DRAFT_KEYS) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEYS[key]);
}

export function clearAllDrafts() {
  (Object.keys(DRAFT_KEYS) as (keyof typeof DRAFT_KEYS)[]).forEach((k) => clearDraft(k));
}

// localStorage'daki TÜM bekleyen taslakları toplar (hangi admin sayfasında olursan ol)
export function collectAllPendingDrafts() {
  return {
    characters: getDraft("characters"),
    quotes: getDraft("quotes"),
    houses: getDraft("houses"),
  };
}

export function hasAnyPendingDraft() {
  const drafts = collectAllPendingDrafts();
  return !!(drafts.characters || drafts.quotes || drafts.houses);
}

// Taslak, orijinal (canlı) veriden gerçekten farklı mı diye kontrol eder.
// Sadece localStorage'da veri OLMASI yeterli değil; içeriği orijinalle
// aynıysa bu "değişiklik yok" demektir ve "unpublished changes" uyarısı
// gösterilmemelidir.
export function isDraftDifferentFromOriginal(draftValue: unknown, originalValue: unknown): boolean {
  if (draftValue === null || draftValue === undefined) return false;
  return JSON.stringify(draftValue) !== JSON.stringify(originalValue);
}