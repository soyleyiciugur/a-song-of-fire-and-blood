// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\data\characters\old\index.ts
import { z } from "zod";
import charactersData from "./characters.json";
import { CharacterSchema, type CharacterFromSchema } from "../../schemas/character"; 
// (Eğer schemas klasörünün yolu farklıysa "../../schemas/character" kısmını doğru yola göre düzeltmelisin)

// JSON'ı senin karakter kurallarına göre test edip içeri alıyoruz
const parsedCharacters = z.array(CharacterSchema).parse(charactersData);

// Sitenin alıştığı Record<string, Character> formatına geri çeviriyoruz
export const characters: Record<string, CharacterFromSchema> = parsedCharacters.reduce((acc, char) => {
  acc[char.id] = char;
  return acc;
}, {} as Record<string, CharacterFromSchema>);