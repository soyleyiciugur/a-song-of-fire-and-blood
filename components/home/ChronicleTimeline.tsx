import Link from "next/link";

import worldDate from "@/data/worldDate.json";
import { timeline } from "@/data/timeline";
import { getCharacter } from "@/lib/characters";
import MiniPortrait from "@/components/MiniPortrait";
import ChronicleMarker from "./ChronicleMarker";

import styles from "./chronicleTimeline.module.css";

function eventAnchor(chapterSlug: string, title: string) {
  return `${chapterSlug}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export default function ChronicleTimeline() {
  const edgeGap = 8;
  const currentPosition = 100 - edgeGap;

  return (
    <section className={styles.section} aria-labelledby="chronicle-timeline-title">
        <div className={styles.header}>
          <div>
            <span className={styles.eyebrow}>The Known Chronicle</span>
            <h2 id="chronicle-timeline-title">Aegon&apos;s Conquest &rarr; The Unknown</h2>
          </div>
        </div>
      <div className={styles.viewport}>
        <div className={styles.track}>
          <span className={styles.progress} style={{ width: `${currentPosition}%` }} />
          <span className={styles.epochMarker} style={{ left: "0%" }} aria-label="Aegon&apos;s Conquest">✦</span>
          <span className={`${styles.epochMarker} ${styles.epochMarkerPresent}`} style={{ left: `${currentPosition}%` }} aria-label="Present">✦</span>
          <span className={`${styles.edgeLabel} ${styles.edgeLabelStart}`} style={{ left: "0%" }}>Aegon&apos;s Conquest</span>
          <span className={`${styles.edgeLabel} ${styles.edgeLabelPresent}`} style={{ left: `${currentPosition}%` }}><span>Present</span><span>{worldDate.day}/{worldDate.moon}/{worldDate.year} {worldDate.era}</span></span>
          <span className={`${styles.edgeLabel} ${styles.future}`} style={{ left: "100%" }}>Unknown</span>
          {timeline.map((chapter, index) => {
            const position = edgeGap + (index / Math.max(1, timeline.length - 1)) * (currentPosition - edgeGap - 4);
            const characters = Array.from(new Set(chapter.events.flatMap((event) => event.characters ?? [])));
            return (
              <ChronicleMarker key={chapter.chapterSlug} position={position} href={`/timeline#${chapter.chapterSlug}`} label={chapter.chapterTitle}>
                  <Link href={`/timeline#${chapter.chapterSlug}`} className={styles.chapter}>{chapter.chapterTitle}</Link>
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
              </ChronicleMarker>
            );
          })}
        </div>
      </div>
    </section>
  );
}
