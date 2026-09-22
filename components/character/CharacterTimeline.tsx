"use client";

import Link from "next/link";
import { timeline } from "@/data/timeline";
import type { Character } from "@/types/character";
import { parseTimelineDate, timelineDateOrder } from "@/lib/timeline-date";
import styles from "./characterTimeline.module.css";
import { useSpoilerBoundary } from "@/components/reading/ReadingProgressProvider";
import ContinueReadingLink from "@/components/reading/ContinueReadingLink";

export default function CharacterTimeline({ character }: { character: Character }) {
  const { canReveal } = useSpoilerBoundary();
  const moments = timeline.flatMap((chapter) => chapter.events.filter((event) => event.characters?.includes(character.id)).map((event) => ({ ...event, chapterSlug: chapter.chapterSlug, chapterTitle: chapter.chapterTitle, order: parseTimelineDate(event.date, chapter.date) })));
  const historicalMoments = character.personalTimeline ?? [];
  if (!character.nameday && !character.death && moments.length === 0 && historicalMoments.length === 0) return null;
  const entries = [
    ...moments.map((moment) => ({
      key: `${moment.chapterSlug}-${moment.title}`,
      order: moment.order,
      boundary: 1,
      locked: !canReveal(moment.chapterSlug),
      content: <div>
        <strong>{moment.title}</strong>
        <span>{moment.date ?? moment.chapterTitle}</span>
        <p>{moment.description}</p>
        <Link href={`/chapters/${moment.chapterSlug}`}>Read chapter →</Link>
      </div>,
    })),
    ...historicalMoments.map((moment) => ({
      key: `history-${moment.title}-${moment.date}`,
      order: moment.order,
      boundary: 1,
      locked: Boolean(moment.chapterSlug && !canReveal(moment.chapterSlug)),
      content: <div>
        <strong>{moment.title}</strong>
        <span>{moment.date}</span>
        {moment.description && <p>{moment.description}</p>}
      </div>,
    })),
    ...([ ["Born", character.nameday], ["Death", character.death] ] as const).flatMap(([label, date]) => date ? [{
      key: label,
      order: timelineDateOrder(date),
      boundary: label === "Born" ? 0 : 2,
      locked: label === "Death" && Boolean(moments.find((moment) => /death|dies|killed|murdered/i.test(`${moment.title} ${moment.description}`) && !canReveal(moment.chapterSlug))),
      content: <><strong>{label}</strong><span>{date.day}/{date.moon}/{date.year} AC</span></>,
    }] : []),
  ].sort((a, b) => a.boundary - b.boundary || a.order - b.order);
  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <span>Personal chronology</span>
        <h2>{character.name}&apos;s timeline</h2>
      </div>
      <div className={styles.rail}>
        <div className={styles.conquest}>Aegon&apos;s Conquest</div>
        {entries.map((entry) => (
          <div className={`${styles.moment} ${entry.locked ? styles.lockedMoment : ""}`} key={entry.key} id={`character-event-${entry.key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
            <i />
            {entry.locked ? (
              <div className={styles.lockedContent}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10M6 10h12v10H6z" /></svg>
                <div><strong>Spoiler-sealed moment</strong><span>Continue reading to reveal this entry.</span><ContinueReadingLink /></div>
              </div>
            ) : entry.content}
          </div>
        ))}
        <div className={styles.unknown}>The future remains unwritten</div>
      </div>
    </section>
  );
}
