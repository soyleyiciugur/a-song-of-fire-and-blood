// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\timeline\page.tsx
"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

import { timeline, getTimelineEventKind } from "@/data/timeline";
import { getCharacter } from "@/lib/characters";
import MiniPortrait from "@/components/MiniPortrait";
import SearchableSelect from "@/components/SearchableSelect";

import styles from "./timeline.module.css";

export default function Timeline() {
  const sortedTimeline = [...timeline].reverse();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [characterFilter, setCharacterFilter] = useState("all");
  const kinds = ["all", "conflict", "death", "politics", "family", "travel", "revelation"];
  const humanizeLabel = (value: string) => value.split(/[-_\s]+/).filter(Boolean).map((part) => part.charAt(0).toLocaleUpperCase("en-US") + part.slice(1)).join(" ");
  const characterOptions = Array.from(new Set(sortedTimeline.flatMap((chapter) => chapter.events.flatMap((event) => event.characters ?? []))))
    .sort()
    .map((id) => ({ value: id, label: getCharacter(id)?.name ?? humanizeLabel(id) }));
  const matchesKind = (event: (typeof sortedTimeline)[number]["events"][number], value: string) => {
    if (value === "all") return true;
    return getTimelineEventKind(event) === value;
  };
  const filteredTimeline = useMemo(() => sortedTimeline.map((chapter) => ({
    ...chapter,
    events: chapter.events.filter((event) => {
      const text = `${event.title} ${event.description} ${event.characters?.join(" ")}`.toLowerCase();
      const queryMatch = !query || text.includes(query.toLowerCase());
      const kindMatch = matchesKind(event, kind);
      const characterMatch = characterFilter === "all" || event.characters?.includes(characterFilter as never);
      return queryMatch && kindMatch && characterMatch;
    }),
  })).filter((chapter) => chapter.events.length > 0), [characterFilter, kind, query]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={`${styles.heading} realm-page-title`}>Timeline</h1>

        <p className={styles.subheading}>
          The major turns of the realm, chapter by chapter.
        </p>

        <nav className={`${styles.tabs} realm-section-tabs`} aria-label="Chronicle sections">
          <Link aria-current="page" className={styles.activeTab} href="/timeline">Timeline</Link>
          <Link href="/chronicle">Annals</Link>
          <Link href="/wars">The Bloodshed</Link>
        </nav>

        <div className={styles.filters}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the timeline…" aria-label="Search timeline" />
          <div className={styles.characterSelect}>
            <SearchableSelect
              options={[{ value: "all", label: "All characters" }, ...characterOptions]}
              value={characterFilter}
              onChange={setCharacterFilter}
              placeholder="All characters"
              searchPlaceholder="Search characters…"
              aria-label="Filter by character"
            />
          </div>
          {kinds.map((value) => <button type="button" key={value} className={kind === value ? styles.filterActive : ""} onClick={() => setKind(value)}>{humanizeLabel(value)}</button>)}
        </div>

        <div className={styles.chapters}>
          {filteredTimeline.map((chapter) => (
            <section key={chapter.chapterSlug} id={chapter.chapterSlug} className={styles.chapterBlock}>
              <Link
                href={`/chapters/${chapter.chapterSlug}`}
                className={styles.chapterTitle}
              >
                {chapter.chapterTitle}
              </Link>

              {chapter.date && (
                <p className={styles.chapterDate}>{chapter.date}</p>
              )}

              <ol className={styles.eventList}>
                {[...chapter.events].reverse().map((event) => (
                  <li key={event.title} id={`${chapter.chapterSlug}-${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className={styles.event}>
                    <div className={styles.eventMarker} />

                    <div className={styles.eventBody}>
                      <h3 className={styles.eventTitle}>{event.title}</h3>

                      <span className={styles.eventKind}>{humanizeLabel(getTimelineEventKind(event))}</span>

                      {event.date && (
                        <p className={styles.eventDate}>{event.date}</p>
                      )}

                      <p className={styles.eventDescription}>
                        {event.description}
                      </p>

                      {event.characters && event.characters.length > 0 && (
                        <div className={styles.eventCharacters}>
                          {event.characters.map((id) => {
                            const character = getCharacter(id);
                            if (!character) return null;

                            return (
                              <Link
                                key={id}
                                href={`/characters/${id}`}
                                className={styles.characterChip}
                              >
                                <MiniPortrait
                                  id={id}
                                  alt={character.name}
                                />
                                <span>{character.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
