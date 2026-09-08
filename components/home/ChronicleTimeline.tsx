import Link from "next/link";

import worldDate from "@/data/worldDate.json";
import { timeline } from "@/data/timeline";
import { getCharacter } from "@/lib/characters";

import styles from "./chronicleTimeline.module.css";

export default function ChronicleTimeline() {
  const chapters = timeline;
  const currentPosition = Math.max(8, ((worldDate.year - 1) / 120) * 100);

  return (
    <section className={styles.section} aria-labelledby="chronicle-timeline-title">
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>The Known Chronicle</span>
          <h2 id="chronicle-timeline-title">Aegon&apos;s Conquest → The Unknown</h2>
        </div>
        <span className={styles.today}>Present · {worldDate.day} / {worldDate.moon} / {worldDate.year} {worldDate.era}</span>
      </div>
      <div className={styles.viewport}>
        <div className={styles.track}>
          <span className={styles.progress} style={{ width: `${currentPosition}%` }} />
          <span className={styles.edgeLabel} style={{ left: "1%" }}>Aegon&apos;s Conquest</span>
          <span className={styles.edgeLabel} style={{ left: `${currentPosition}%` }}>Present</span>
          <span className={`${styles.edgeLabel} ${styles.future}`} style={{ left: "99%" }}>Unknown</span>
          {chapters.map((chapter, index) => {
            const position = 6 + (index / Math.max(1, chapters.length - 1)) * (currentPosition - 12);
            const characters = Array.from(new Set(chapter.events.flatMap((event) => event.characters ?? [])));
            return (
              <div key={chapter.chapterSlug} className={styles.marker} style={{ left: `${position}%` }}>
                <span className={styles.dot} />
                <div className={styles.tooltip}>
                  <Link href={`/chapters/${chapter.chapterSlug}`} className={styles.chapter}>{chapter.chapterTitle}</Link>
                  {chapter.date && <span className={styles.date}>{chapter.date}</span>}
                  <ul>{chapter.events.slice(0, 4).map((event) => <li key={event.title}>{event.title}</li>)}</ul>
                  {characters.length > 0 && <div className={styles.portraits}>{characters.slice(0, 5).map((id) => {
                    const character = getCharacter(id);
                    return character ? <img key={id} src={`/images/miniportraits/${id}.webp`} alt={character.name} /> : null;
                  })}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
