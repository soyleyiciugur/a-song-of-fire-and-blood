// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\scrolls\[id]\page.tsx
import { notFound } from "next/navigation";
import { getPublishedScrollById, getAllScrolls } from "@/lib/scrolls";
import ScrollDisplay from "@/components/scroll/ScrollDisplay";
import { getCharacter } from "@/lib/characters";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return getAllScrolls().map((scroll) => ({ id: scroll.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const scroll = getPublishedScrollById(id);
  if (!scroll) return {};
  return {
    title: scroll.title,
    description: scroll.summary,
  };
}

export default async function ScrollPage({ params }: PageProps) {
  const { id } = await params;
  const scroll = getPublishedScrollById(id);

  if (!scroll) {
    notFound();
  }

  const relatedCharacters = scroll.relatedCharacterIds
    .map((cid) => getCharacter(cid))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({ id: c.id, name: c.name }));

  return <ScrollDisplay scroll={scroll} relatedCharacters={relatedCharacters} />;
}
