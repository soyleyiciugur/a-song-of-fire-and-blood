// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\lib\character-assets.ts
import type { CharacterId } from "@/types/character";

export const characterAssets = {
  portrait: (id: CharacterId) =>
    `/images/characters/${id}.webp`,

  mini: (id: CharacterId) =>
    `/images/miniportraits/${id}.webp`,
};