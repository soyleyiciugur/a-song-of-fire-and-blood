// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\characters\[id]\page.tsx
import { notFound } from "next/navigation";
import { getCharacter, getQuotesByCharacterId } from "@/lib/characters";
import CharacterInfoBox from "@/components/character/CharacterInfoBox";
import CharacterQuote from "@/components/character/CharacterQuote";
import CharacterHeader from "@/components/character/CharacterHeader";
import CharacterBiography from "@/components/character/CharacterBiography";
import CharacterTraits from "@/components/character/CharacterTraits";
import CharacterRelationships from "@/components/character/CharacterRelationships";
import type { Character } from "@/types/character";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CharacterPage({ params }: Props) {
  const { id } = await params;
  const character = getCharacter(id) as Character | undefined;
  const quotes = getQuotesByCharacterId(id);

  if (!character) notFound();

  return (
    <main className="page">
      <div className="container">
        <CharacterHeader character={character} />

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 40, alignItems: "start" }}>
          <div>
            <CharacterBiography summary={character.summary} />
            <CharacterTraits traits={character.traits} />
            
            {/* Hata veren "as ComponentType" hack'i kaldırıldı, doğrudan kullanıldı */}
            <CharacterRelationships relationships={character.relationships as Record<string, string>} />

            {quotes.length > 0 && (
              <section>
                <h2 style={{ color: "var(--gold)", marginBottom: 18, borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
                  Notable Quotes
                </h2>
                {quotes.map((q, i) => <CharacterQuote key={i} quote={q} />)}
              </section>
            )}
          </div>

          <CharacterInfoBox character={character} />
        </div>
      </div>
    </main>
  );
}