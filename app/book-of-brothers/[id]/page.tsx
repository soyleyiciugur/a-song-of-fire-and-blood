// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\book-of-brothers\[id]\page.tsx
import { notFound } from "next/navigation";
import {
  getPublishedKingsguardEntryById,
  getAllKingsguardEntries,
} from "@/lib/bookOfBrothers";
import { getCharacter } from "@/lib/characters";
import KingsguardPage from "@/components/bookOfBrothers/KingsguardPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return getAllKingsguardEntries().map((entry) => ({ id: entry.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const entry = getPublishedKingsguardEntryById(id);
  if (!entry) return {};
  const character = entry.characterId ? getCharacter(entry.characterId) : undefined;
  const name = character?.name ?? entry.manualName ?? "Unknown Knight";
  return {
    title: `${name} — Book of Brothers`,
  };
}

export default async function BookOfBrothersEntryPage({ params }: PageProps) {
  const { id } = await params;
  const entry = getPublishedKingsguardEntryById(id);

  if (!entry) {
    notFound();
  }

  const character = entry.characterId ? getCharacter(entry.characterId) : undefined;
  const precedingCharacter = entry.precedingCharacterId
    ? getCharacter(entry.precedingCharacterId)
    : undefined;

  return (
    <KingsguardPage
      entry={entry}
      character={character}
      precedingCharacter={precedingCharacter}
    />
  );
}