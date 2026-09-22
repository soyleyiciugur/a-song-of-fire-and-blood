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
      <nav className={styles.characterConnections} aria-label={`${character.name} profile connections`}>
        <Link href={`/characters/${character.id}?tab=appearances`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM8 9h8M8 13h5" /></svg>Appearances</Link>
        <Link href={`/timeline?character=${character.id}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5v14M9 7h10M9 12h7M9 17h9" /></svg>Events</Link>
        <Link href={`/characters/${character.id}/thoughts`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18.5c2.5-1.2 5.2-1.8 8-1.8s5.5.6 8 1.8M7 14V8l5-4 5 4v6M9.5 14v-3.5h5V14" /></svg>Inner Court</Link>
      </nav>
    </section>
  );
}
