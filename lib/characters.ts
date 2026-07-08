import charactersData from "@/data/characters/characters.json";
import quotesData from "@/data/quotes.json";
import type { Character } from "@/types/character";

const characters = charactersData as Character[];

// Tüm karakterleri getiren fonksiyon
export function getCharacters(): Character[] {
  return characters;
}

// ID ile TEK bir karakter getiren fonksiyon
export function getCharacter(id: string) {
  return characters.find((char) => char.id === id);
}

// Rastgele alıntı
export function getRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotesData.length);
  return quotesData[randomIndex];
}

// Karakter ID'sine göre alıntıları filtreleyen fonksiyon
export function getQuotesByCharacterId(id: string) {
  return quotesData.filter((quote) => quote.speakerId === id);
}