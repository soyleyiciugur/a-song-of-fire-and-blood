import type { CharacterId } from "@/types/character";

const DEFAULT_MINI = "/images/miniportraits/default.png";

export function getMiniPortrait(id: CharacterId) {
  return `/images/miniportraits/${id}.webp`;
}

export function getSafeMiniPortrait(id?: string | null) {
  if (!id) return DEFAULT_MINI;

  return `/images/miniportraits/${id}.webp`;
}