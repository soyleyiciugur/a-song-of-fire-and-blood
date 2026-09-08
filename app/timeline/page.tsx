// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\timeline\page.tsx
"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

import { timeline } from "@/data/timeline";
import { getCharacter } from "@/lib/characters";
import MiniPortrait from "@/components/MiniPortrait";

import styles from "./timeline.module.css";

export default function Timeline() {
  const sortedTimeline = [...timeline].reverse();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [characterFilter, setCharacterFilter] = useState("all");
  const kinds = ["all", "conflict", "death", "politics", "family", "travel", "revelation"];
  const characterOptions = Array.from(new Set(sortedTimeline.flatMap((chapter) => chapter.events.flatMap((event) => event.characters ?? [])))).sort();
  const matchesKind = (title: string, description: string, value: string) => {
    if (value === "all") return true;
    const text = `${title} ${description}`.toLowerCase();
    const patterns: Record<string, RegExp> = {
      conflict: /battle|duel|fight|war|kill|murder|assault|tourney|combat|attack|clash|sword/,
      death: /dead|death|die|dies|killed|murder|execut|slaughter|massacre|poison/,
      politics: /king|crown|throne|heir|council|hand|lord|claim|alliance|war|faith/,
      family: /father|mother|brother|sister|son|daughter|wife|husband|child|family|marry/,
      travel: /travel|arrive|depart|fly|flee|escape|journey|ride|return|reach/,
      revelation: /reveal|secret|discover|learn|confess|letter|identity|truth|unknown/,
    };
    return patterns[value]?.test(text) ?? true;
  };
  const filteredTimeline = useMemo(() => sortedTimeline.map((chapter) => ({
    ...chapter,
    events: chapter.events.filter((event) => {
      const text = `${event.title} ${event.description} ${event.characters?.join(" ")}`.toLowerCase();
      const queryMatch = !query || text.includes(query.toLowerCase());
      const kindMatch = matchesKind(event.title, event.description, kind);
      const characterMatch = characterFilter === "all" || event.characters?.includes(characterFilter as never);
      return queryMatch && kindMatch && characterMatch;
    }),
  })).filter((chapter) => chapter.events.length > 0), [characterFilter, kind, query]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Timeline</h1>

        <p className={styles.subheading}>
          The major turns of the realm, chapter by chapter.
        </p>

        <div className={styles.filters}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the timeline…" aria-label="Search timeline" />
          <select value={characterFilter} onChange={(event) => setCharacterFilter(event.target.value)} aria-label="Filter by character"><option value="all">All characters</option>{characterOptions.map((id) => <option key={id} value={id}>{id.replaceAll("-", " ")}</option>)}</select>
          {kinds.map((value) => <button key={value} className={kind === value ? styles.filterActive : ""} onClick={() => setKind(value)}>{value}</button>)}
        </div>

        <div className={styles.chapters}>
          {filteredTimeline.map((chapter) => (
            <section key={chapter.chapterSlug} className={styles.chapterBlock}>
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
                  <li key={event.title} className={styles.event}>
                    <div className={styles.eventMarker} />

                    <div className={styles.eventBody}>
                      <h3 className={styles.eventTitle}>{event.title}</h3>

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
