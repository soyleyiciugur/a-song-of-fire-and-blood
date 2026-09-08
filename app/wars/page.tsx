"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import bloodshed from "@/data/bloodshed.json";
import { timeline } from "@/data/timeline";
import { getCharacter } from "@/lib/characters";
import MiniPortrait from "@/components/MiniPortrait";
import styles from "./wars.module.css";

type BloodshedEvent = (typeof bloodshed)[number];
function formatDate(event: BloodshedEvent) { return `${event.day} / ${event.moon}${event.year ? ` / ${event.year} AC` : ""}`; }

export default function BloodshedPage() {
  const entries = [...bloodshed].sort((a, b) => a.year - b.year || a.moon - b.moon || a.day - b.day);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = entries.find((event) => event.id === selectedId) ?? null;
  const relatedChapter = useMemo(() => selected ? timeline.find((chapter) => chapter.chapterSlug === selected.chapterSlug) : null, [selected]);
  return <main className={styles.page}><div className={styles.container}><p className={styles.eyebrow}>Wars · Duels · Tourneys</p><h1 className={styles.heading}>The Bloodshed</h1><p className={styles.subheading}>The battles, trials, and contests that left their mark upon the realm.</p><nav className={styles.tabs} aria-label="Chronicle sections"><Link href="/timeline">Timeline</Link><Link href="/chronicle">Annals</Link><Link className={styles.activeTab} href="/wars">The Bloodshed</Link></nav><div className={styles.intro}><span className={styles.introMark}>⚔</span><p>Every victory has a cost. Every peace remembers the blade.</p></div><div className={styles.contentGrid}><section className={styles.list} aria-label="Bloodshed events">{entries.map((event) => <article key={event.id} className={`${styles.event} ${selectedId === event.id ? styles.eventSelected : ""}`} onClick={() => setSelectedId(event.id)}><div className={styles.date}>{formatDate(event)}</div><div className={styles.rail} aria-hidden="true"><span /></div><div className={styles.body}><span className={styles.type}>{event.kind}</span><h2>{event.title}</h2><p>{event.summary}</p><div className={styles.meta}><Link href={`/map?location=${encodeURIComponent(event.location)}`} onClick={(e) => e.stopPropagation()}>{event.location}</Link><Link href={`/chapters/${event.chapterSlug}`} onClick={(e) => e.stopPropagation()}>Read the chapter →</Link></div><div className={styles.characters}>{event.participants.map((id) => { const character = getCharacter(id); return character ? <MiniPortrait key={id} id={id} alt={character.name} /> : null; })}</div></div></article>)}</section>{selected && <aside className={styles.detailPanel} aria-live="polite"><button className={styles.close} onClick={() => setSelectedId(null)} aria-label="Close details">×</button><span className={styles.type}>{selected.kind}</span><h2>{selected.title}</h2><p>{selected.summary}</p><dl><div><dt>Location</dt><dd><Link href={`/map?location=${encodeURIComponent(selected.location)}`}>{selected.location}</Link></dd></div><div><dt>Chapter</dt><dd><Link href={`/chapters/${selected.chapterSlug}`}>{relatedChapter?.chapterTitle ?? selected.chapterSlug}</Link></dd></div></dl><h3>Those present</h3><div className={styles.related}>{selected.participants.map((id) => { const character = getCharacter(id); return character ? <Link href={`/characters/${id}`} key={id}><MiniPortrait id={id} alt={character.name} size={28} />{character.name}</Link> : null; })}</div><h3>Cause</h3><p className={styles.context}>{selected.cause}</p><h3>Consequence</h3><p className={styles.context}>{selected.consequence}</p></aside>}</div></div></main>;
}
