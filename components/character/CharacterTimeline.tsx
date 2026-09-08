import Link from "next/link";
import { timeline } from "@/data/timeline";
import type { Character } from "@/types/character";
import styles from "./characterTimeline.module.css";

export default function CharacterTimeline({ character }: { character: Character }) {
  const moments = timeline.flatMap((chapter) => chapter.events.filter((event) => event.characters?.includes(character.id)).map((event) => ({ ...event, chapterSlug: chapter.chapterSlug, chapterTitle: chapter.chapterTitle })));
  if (!character.nameday && !character.death && moments.length === 0) return null;
  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <span>Personal chronology</span>
        <h2>{character.name}&apos;s timeline</h2>
      </div>
      <div className={styles.rail}>
        <div className={styles.conquest}>Aegon&apos;s Conquest</div>
        {character.nameday && (
          <div className={styles.moment}>
            <i />
            <strong>Born</strong>
            <span>{character.nameday.day}/{character.nameday.moon}/{character.nameday.year} AC</span>
          </div>
        )}
        {moments.map((moment) => (
          <div className={styles.moment} key={`${moment.chapterSlug}-${moment.title}`}>
            <i />
            <div>
              <strong>{moment.title}</strong>
              <span>{moment.date ?? moment.chapterTitle}</span>
              <p>{moment.description}</p>
              <Link href={`/chapters/${moment.chapterSlug}`}>Read chapter →</Link>
            </div>
          </div>
        ))}
        {character.death && (
          <div className={styles.moment}>
            <i />
            <strong>Death</strong>
            <span>{JSON.stringify(character.death)}</span>
          </div>
        )}
        <div className={styles.unknown}>The future remains unwritten</div>
      </div>
    </section>
  );
}
