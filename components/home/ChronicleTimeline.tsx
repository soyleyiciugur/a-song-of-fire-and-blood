import Link from "next/link";

import worldDate from "@/data/worldDate.json";
import { timeline } from "@/data/timeline";
import { getCharacter } from "@/lib/characters";
import MiniPortrait from "@/components/MiniPortrait";

import styles from "./chronicleTimeline.module.css";

function eventAnchor(chapterSlug: string, title: string) {
  return `${chapterSlug}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export default function ChronicleTimeline() {
  const currentPosition = Math.max(8, Math.min(92, ((worldDate.year - 1) / 120) * 100));

  return (
    <section className={styles.section} aria-labelledby="chronicle-timeline-title">
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>The Known Chronicle</span>
          <h2 id="chronicle-timeline-title">Aegon&apos;s Conquest &rarr; The Unknown</h2>
        </div>
        <span className={styles.today}>Present &middot; {worldDate.day} / {worldDate.moon} / {worldDate.year} {worldDate.era}</span>
      </div>
      <div className={styles.viewport}>
        <div className={styles.track}>
          <span className={styles.progress} style={{ width: `${currentPosition}%` }} />
          <span className={`${styles.edgeLabel} ${styles.edgeLabelStart}`} style={{ left: "1%" }}>Aegon&apos;s Conquest</span>
          <span className={`${styles.edgeLabel} ${styles.edgeLabelPresent}`} style={{ left: `${currentPosition}%` }}>Present &middot; {worldDate.day} / {worldDate.moon} / {worldDate.year} {worldDate.era}</span>
          <span className={`${styles.edgeLabel} ${styles.future}`} style={{ left: "99%" }}>Unknown</span>
          {timeline.map((chapter, index) => {
            const position = 6 + (index / Math.max(1, timeline.length - 1)) * (currentPosition - 12);
            const characters = Array.from(new Set(chapter.events.flatMap((event) => event.characters ?? [])));
            return (
              <div key={chapter.chapterSlug} className={styles.marker} style={{ left: `${position}%` }}>
                <span className={styles.dot} />
                <div className={`${styles.tooltip} ${index === 0 ? styles.tooltipLeft : ""} ${index === timeline.length - 1 ? styles.tooltipRight : ""}`}>
                  <Link href={`/chapters/${chapter.chapterSlug}`} className={styles.chapter}>{chapter.chapterTitle}</Link>
                  {chapter.date && <span className={styles.date}>{chapter.date}</span>}
                  <ul>
                    {chapter.events.slice(0, 4).map((event) => (
                      <li key={event.title}>
                        <Link href={`/timeline#${eventAnchor(chapter.chapterSlug, event.title)}`}>{event.title}</Link>
                      </li>
                    ))}
                  </ul>
                  {characters.length > 0 && (
                    <div className={styles.portraits}>
                      {characters.slice(0, 5).map((id) => {
                        const character = getCharacter(id);
                        return character ? <MiniPortrait key={id} id={id} alt={character.name} size={25} /> : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
