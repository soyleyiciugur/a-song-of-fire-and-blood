import Link from "next/link";
import { timeline } from "@/data/timeline";
import type { Character } from "@/types/character";
import { parseTimelineDate, timelineDateOrder } from "@/lib/timeline-date";
import styles from "./characterTimeline.module.css";

export default function CharacterTimeline({ character }: { character: Character }) {
  const moments = timeline.flatMap((chapter) => chapter.events.filter((event) => event.characters?.includes(character.id)).map((event) => ({ ...event, chapterSlug: chapter.chapterSlug, chapterTitle: chapter.chapterTitle, order: parseTimelineDate(event.date, chapter.date) })));
  if (!character.nameday && !character.death && moments.length === 0) return null;
  const entries = [
    ...moments.map((moment) => ({
      key: `${moment.chapterSlug}-${moment.title}`,
      order: moment.order,
      content: <div>
        <strong>{moment.title}</strong>
        <span>{moment.date ?? moment.chapterTitle}</span>
        <p>{moment.description}</p>
        <Link href={`/chapters/${moment.chapterSlug}`}>Read chapter →</Link>
      </div>,
    })),
    ...([ ["Born", character.nameday], ["Death", character.death] ] as const).flatMap(([label, date]) => date ? [{
      key: label,
      order: timelineDateOrder(date),
      content: <><strong>{label}</strong><span>{date.day}/{date.moon}/{date.year} AC</span></>,
    }] : []),
  ].sort((a, b) => a.order - b.order);
  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <span>Personal chronology</span>
        <h2>{character.name}&apos;s timeline</h2>
      </div>
      <div className={styles.rail}>
        <div className={styles.conquest}>Aegon&apos;s Conquest</div>
        {entries.map((entry) => (
          <div className={styles.moment} key={entry.key}>
            <i />
            {entry.content}
          </div>
        ))}
        <div className={styles.unknown}>The future remains unwritten</div>
      </div>
    </section>
  );
}
