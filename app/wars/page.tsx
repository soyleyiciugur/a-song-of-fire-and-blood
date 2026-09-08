"use client";
import { useMemo, useState } from "react";
import Link from "next/link";

import events from "@/data/events.json";
import { timeline } from "@/data/timeline";
import { getCharacter } from "@/lib/characters";
import MiniPortrait from "@/components/MiniPortrait";

import styles from "./wars.module.css";

type BloodshedEvent = (typeof events)[number];

const bloodshedTypes = new Set(["battle", "tournament", "trial"]);

function formatDate(event: BloodshedEvent) {
  return `${event.day} / ${event.moon}${event.year ? ` / ${event.year} AC` : ""}`;
}

export default function BloodshedPage() {
  const entries = events
    .filter((event) => bloodshedTypes.has(event.type))
    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0) || a.moon - b.moon || a.day - b.day);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = entries.find((event) => event.id === selectedId) ?? null;
  const relatedChapter = useMemo(() => selected ? timeline.find((chapter) => chapter.chapterSlug === selected.chapterSlug) : null, [selected]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>Wars · Duels · Tourneys</p>
        <h1 className={styles.heading}>The Bloodshed</h1>
        <p className={styles.subheading}>
          The battles, trials, and contests that left their mark upon the realm.
        </p>

        <div className={styles.intro}>
          <span className={styles.introMark}>⚔</span>
          <p>Every victory has a cost. Every peace remembers the blade.</p>
        </div>

        <div className={styles.contentGrid}>
        <section className={styles.list} aria-label="Bloodshed events">
          {entries.map((event) => (
            <article key={event.id} className={`${styles.event} ${selectedId === event.id ? styles.eventSelected : ""}`} onClick={() => setSelectedId(event.id)}>
              <div className={styles.date}>{formatDate(event)}</div>
              <div className={styles.rail} aria-hidden="true"><span /></div>
              <div className={styles.body}>
                <span className={styles.type}>{event.type}</span>
                <h2>{event.title}</h2>
                <p>{event.description}</p>
                <div className={styles.meta}>
                  <span>{event.location}</span>
                  <Link href={`/chapters/${event.chapterSlug}`}>Read the chapter →</Link>
                </div>
                {"characters" in event && Array.isArray(event.characters) && event.characters.length > 0 && (
                  <div className={styles.characters}>
                    {event.characters.map((id: string) => {
                      const character = getCharacter(id);
                      return character ? <MiniPortrait key={id} id={id} alt={character.name} /> : null;
                    })}
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>
        {selected && <aside className={styles.detailPanel} aria-live="polite"><button className={styles.close} onClick={() => setSelectedId(null)} aria-label="Close details">×</button><span className={styles.type}>{selected.type}</span><h2>{selected.title}</h2><p>{selected.description}</p><dl><div><dt>Location</dt><dd>{selected.location}</dd></div><div><dt>Chapter</dt><dd><Link href={`/chapters/${selected.chapterSlug}`}>{relatedChapter?.chapterTitle ?? selected.chapterSlug}</Link></dd></div></dl>{relatedChapter && <><h3>Those present</h3><div className={styles.related}>{Array.from(new Set(relatedChapter.events.flatMap((event) => event.characters ?? []))).map((id) => { const character = getCharacter(id); return character ? <Link href={`/characters/${id}`} key={id}>{character.name}</Link> : null; })}</div><h3>Cause & consequence</h3><p className={styles.context}>{relatedChapter.events.find((event) => event.title.toLowerCase().includes(selected.title.toLowerCase().split(" ").slice(-1)[0]))?.description ?? "The wider consequences are recorded across this chapter."}</p></>}</aside>}
        </div>
      </div>
    </main>
  );
}
