import Image from "next/image";
import Link from "next/link";
import { computeAge, resolvePortraitAgeState } from "@/lib/age";
import {
  getCharacterPortraitVariants,
  resolveAvailablePortraitState,
} from "@/lib/characterPortraits";
import { getCharacter } from "@/lib/characters";
import worldDate from "@/data/worldDate.json";
import styles from "@/app/users/[username]/profile.module.css";

export default function PlayedCharacterCard({
  characterId,
  isGameMaster = false,
}: {
  characterId: string;
  isGameMaster?: boolean;
}) {
  const character = getCharacter(characterId);
  if (!character) return null;

  const age =
    character.age ??
    (character.nameday
      ? computeAge(character.nameday, worldDate, character.death)
      : undefined);
  const requestedState = resolvePortraitAgeState(age, character.portraitAgeState);
  const portraits = getCharacterPortraitVariants(character.id);
  const portraitState = resolveAvailablePortraitState(requestedState, portraits);
  const portrait = portraits[portraitState];

  return (
    <section className={`${styles.playedCharacter} ${isGameMaster ? styles.gmCharacter : ""}`}>
      <div className={styles.sectionHeading}>
        <div>
          <span>{isGameMaster ? "A perfectly normal casting choice" : "At the table"}</span>
          <h2>Played Character</h2>
        </div>
      </div>
      <Link href={`/characters/${character.id}`} className={styles.playedCharacterLink}>
        <span className={styles.playedCharacterPortrait}>
          {portrait ? (
            <Image
              src={portrait}
              alt={character.name}
              fill
              sizes="(max-width: 540px) 78px, 92px"
            />
          ) : (
            <span aria-hidden="true">{character.name.slice(0, 2).toUpperCase()}</span>
          )}
        </span>
        <span className={styles.playedCharacterBody}>
          <small>{isGameMaster ? "Game Master, narrator, and suspiciously everyone else" : character.house && character.house !== "-" ? character.house : "Character"}</small>
          <strong>{isGameMaster ? "HRRM (playing the entire realm)" : character.name}</strong>
          <span>{isGameMaster ? "The NPC budget got out of hand." : character.title && character.title !== "-" ? character.title : character.nickname || "View character"}</span>
        </span>
        <span className={styles.playedCharacterArrow} aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
