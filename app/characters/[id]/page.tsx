// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\characters\[id]\page.tsx
import { notFound } from "next/navigation";
import { getCharacter, getQuotesByCharacterId } from "@/lib/characters";
import { computeAge, resolvePortraitAgeState } from "@/lib/age";
import { getCharacterPortraitVariants } from "@/lib/characterPortraits";
import worldDate from "@/data/worldDate.json";
import CharacterInfoBox from "@/components/character/CharacterInfoBox";
import CharacterQuote from "@/components/character/CharacterQuote";
import CharacterHeader from "@/components/character/CharacterHeader";
import CharacterBiography from "@/components/character/CharacterBiography";
import CharacterTraits from "@/components/character/CharacterTraits";
import CharacterRelationships from "@/components/character/CharacterRelationships";
import type { Character } from "@/types/character";
import styles from "./characterDetail.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CharacterPage({ params }: Props) {
  const { id } = await params;
  const character = getCharacter(id) as Character | undefined;
  const quotes = getQuotesByCharacterId(id);

  if (!character) notFound();

  const age =
    character.age ??
    (character.nameday
      ? computeAge(character.nameday, worldDate, character.death)
      : undefined);

  const currentAgeState = resolvePortraitAgeState(
    age,
    character.portraitAgeState
  );

  const portraitVariants = getCharacterPortraitVariants(
    character.id,
    currentAgeState,
    character.portrait
  );

  return (
    <main className="page">
      <div className="container">
        <CharacterHeader character={character} />

        <div className={styles.detailGrid}>
          <div className={styles.mainColumn}>
            <CharacterBiography summary={character.summary} />
            <CharacterTraits traits={character.traits} />

            <CharacterRelationships
              relationships={character.relationships as Record<string, string>}
            />

            {quotes.length > 0 && (
              <section>
                <h2 className={styles.quotesHeading}>Notable Quotes</h2>
                {quotes.map((q, i) => (
                  <CharacterQuote key={i} quote={q} />
                ))}
              </section>
            )}
          </div>

          <CharacterInfoBox
            character={character}
            currentAgeState={currentAgeState}
            portraitVariants={portraitVariants}
          />
        </div>
      </div>
    </main>
  );
}
