import { notFound } from "next/navigation";

import { getCharacter } from "@/lib/characters";
import CharacterInfoBox from "@/components/character/CharacterInfoBox";
import CharacterQuote from "@/components/character/CharacterQuote";
import CharacterHeader from "@/components/character/CharacterHeader";
import CharacterBiography from "@/components/character/CharacterBiography";
import CharacterTraits from "@/components/character/CharacterTraits";
import CharacterRelationships from "@/components/character/CharacterRelationships";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CharacterPage({ params }: Props) {
  const { id } = await params;
  const character = getCharacter(id);

  if (!character) notFound();

  return (
    <main className="page">
      <div className="container">
        <CharacterHeader character={character} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 340px",
            gap: 40,
            alignItems: "start",
          }}
        >
          <div>
            <CharacterBiography summary={character.summary} />
            <CharacterTraits traits={character.traits} />
            <CharacterRelationships relationships={character.relationships} />

            {(character.quote || character.quotes?.length) && (
              <section>
                <h2
                  style={{
                    color: "var(--gold)",
                    marginBottom: 18,
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 10,
                  }}
                >
                  Notable Quotes
                </h2>
                <CharacterQuote
                  quote={character.quotes?.length ? character.quotes : character.quote}
                />
              </section>
            )}
          </div>

          <CharacterInfoBox character={character} />
        </div>
      </div>
    </main>
  );
}
