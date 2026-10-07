import { redirect } from "next/navigation";

// Preserve old shared card links while the collection lives in the workshop.
export default async function CollectionRedirect({ searchParams }: { searchParams: Promise<{ card?: string | string[] }> }) {
  const params = await searchParams;
  const card = Array.isArray(params.card) ? params.card[0] : params.card;
  redirect(card ? `/cards/decks?card=${encodeURIComponent(card)}` : "/cards/decks");
}
