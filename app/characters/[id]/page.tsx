// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\characters\[id]\page.tsx
import { notFound } from "next/navigation";
import { getCharacter, getQuotesByCharacterId } from "@/lib/characters";
import { computeAge, resolvePortraitAgeState } from "@/lib/age";
import { getCharacterPortraitVariants, resolveAvailablePortraitState } from "@/lib/characterPortraits";
import { getCharacterDebut } from "@/lib/character-debut";
import worldDate from "@/data/worldDate.json";
import CharacterInfoBox from "@/components/character/CharacterInfoBox";
import CharacterQuote from "@/components/character/CharacterQuote";
import CharacterHeader from "@/components/character/CharacterHeader";
import CharacterBiography from "@/components/character/CharacterBiography";
import CharacterTraits from "@/components/character/CharacterTraits";
import CharacterRelationships from "@/components/character/CharacterRelationships";
import CharacterTimeline from "@/components/character/CharacterTimeline";
import CharacterAppearances from "@/components/character/CharacterAppearances";
import CharacterPlayerAttribution from "@/components/character/CharacterPlayerAttribution";
import CharacterProfileTabs from "@/components/character/CharacterProfileTabs";
import { getPlayedCharacterAssignment } from "@/data/character-inner-court";
import { getAllChapters } from "@/data/chapters";
import type { Character } from "@/types/character";
import contentStyles from "@/components/character/characterContent.module.css";
import styles from "./characterDetail.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CharacterPage({ params }: Props) {
  const { id } = await params;
  const character = getCharacter(id) as Character | undefined;
  const chapterOrder = new Map(getAllChapters().map((chapter, index) => [chapter.slug, index]));
  const quotes = [...getQuotesByCharacterId(id)].sort((a, b) => {
    const aOrder = a.chapterSlug ? chapterOrder.get(a.chapterSlug) : undefined;
    const bOrder = b.chapterSlug ? chapterOrder.get(b.chapterSlug) : undefined;
    if (aOrder === undefined && bOrder === undefined) return 0;
    if (aOrder === undefined) return 1;
    if (bOrder === undefined) return -1;
    return bOrder - aOrder;
  });

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

  const portraitVariants = getCharacterPortraitVariants(character.id);
  const availableAgeState = resolveAvailablePortraitState(currentAgeState, portraitVariants);
  const debut = getCharacterDebut(character);
  const playedBy = getPlayedCharacterAssignment(character.id);

  return (
    <main className={`page ${styles.page}`}>
      <div className="container">
        <CharacterHeader character={character} />
        {playedBy && <CharacterPlayerAttribution characterId={character.id} assignment={playedBy} />}

        <div className={styles.detailGrid}>
          <div className={styles.mainColumn}>
            <CharacterProfileTabs
              overview={(
                <>
                  <CharacterBiography summary={character.summary} />
                  <CharacterTraits traits={character.traits} />
                  <CharacterRelationships
                    characterId={character.id}
                    relationships={character.relationships}
                  />
                </>
              )}
              appearances={<CharacterAppearances character={character} />}
              quotes={quotes.length > 0 ? (
              <section className={contentStyles.sectionPanel}>
                <div className={contentStyles.sectionHeader}>
                  <div className={contentStyles.sectionTitleGroup}>
                    <span className={contentStyles.sectionEyebrow}>
                      Words remembered
                    </span>
                    <h2 className={contentStyles.sectionTitle}>Notable Quotes</h2>
                  </div>
                  <p className={contentStyles.sectionHint}>
                    {quotes.length} {quotes.length === 1 ? "quote" : "quotes"}
                  </p>
                </div>

                <div className={contentStyles.quoteList}>
                  {quotes.map((quote, index) => (
                    <CharacterQuote key={index} quote={quote} />
                  ))}
                </div>
              </section>
              ) : (
                <section className={contentStyles.sectionPanel}>
                  <div className={contentStyles.sectionHeader}>
                    <div className={contentStyles.sectionTitleGroup}>
                      <span className={contentStyles.sectionEyebrow}>Words remembered</span>
                      <h2 className={contentStyles.sectionTitle}>Notable Quotes</h2>
                    </div>
                  </div>
                  <p className={contentStyles.sectionHint}>No words have been recorded yet.</p>
                </section>
              )}
              chronology={<CharacterTimeline character={character} />}
            />
          </div>

          <CharacterInfoBox
            character={character}
            currentAgeState={availableAgeState}
            portraitVariants={portraitVariants}
            debut={debut}
          />
        </div>
      </div>
    </main>
  );
}
