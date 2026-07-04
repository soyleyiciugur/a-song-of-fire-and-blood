import type { CharacterId } from "@/types/character";

export const characterAssets = {
  portrait: (id: CharacterId) =>
    `/images/characters/${id}.webp`,

  mini: (id: CharacterId) =>
    `/images/miniportraits/${id}.png`,
};