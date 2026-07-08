import charactersData from "@/data/characters/characters.json";
import quotesData from "@/data/quotes.json";

// Tüm karakterleri getiren fonksiyon
export function getCharacters() {
  return charactersData;
}

// ID ile TEK bir karakter getiren fonksiyon (Hata veren yer burası)
export function getCharacter(id: string) {
  return charactersData.find((char) => char.id === id);
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