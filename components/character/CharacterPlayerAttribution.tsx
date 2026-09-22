import Link from "next/link";
import type { PlayedCharacterAssignment } from "@/data/character-inner-court";
import styles from "./characterPlayerAttribution.module.css";

export default function CharacterPlayerAttribution({ characterId, assignment }: { characterId: string; assignment: PlayedCharacterAssignment }) {
  const handle = `@${assignment.playerUsername}`;
  return (
    <nav className={styles.bar} aria-label="Character pages">
      <span>Played by {assignment.playerProfileHref ? <Link href={assignment.playerProfileHref}>{handle}</Link> : <b>{handle}</b>}</span>
      <Link className={styles.courtLink} href={`/characters/${characterId}/thoughts`}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18.5c2.5-1.2 5.2-1.8 8-1.8s5.5.6 8 1.8M7 14V8l5-4 5 4v6M9.5 14v-3.5h5V14" /></svg>
        The Inner Court
      </Link>
    </nav>
  );
}
