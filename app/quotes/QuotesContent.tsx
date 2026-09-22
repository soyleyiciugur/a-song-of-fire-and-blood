"use client";

import { useMemo, useState } from "react";
import { Select } from "@/app/_components/Select";
import CharacterQuote from "@/components/character/CharacterQuote";
import recordsStyles from "../records/records.module.css";
import styles from "./quotes.module.css";
import { useReadingProgress } from "@/components/reading/ReadingProgressProvider";
import { isWithinSpoilerBoundary } from "@/lib/reading-progress";

type Quote = {
  text: string;
  speakerId?: string;
  speakerName: string;
  chapterSlug?: string | null;
  chapterTitle?: string | null;
  note?: string | null;
};

const characterValue = (quote: Quote) => quote.speakerId || `name:${quote.speakerName}`;

export default function QuotesContent({ quotes }: { quotes: Quote[] }) {
  const { progress, ready } = useReadingProgress();
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [character, setCharacter] = useState("");
  const [chapter, setChapter] = useState("");

  const availableQuotes = useMemo(
    () => quotes.filter((quote) => quote.chapterSlug && (!ready || isWithinSpoilerBoundary(quote.chapterSlug, progress?.chapterSlug))),
    [progress?.chapterSlug, quotes, ready]
  );

  const characterOptions = useMemo(() => {
    const speakers = new Map<string, string>();
    availableQuotes.forEach((quote) => speakers.set(characterValue(quote), quote.speakerName));
    return [
      { id: "", name: "All characters" },
      ...Array.from(speakers, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
    ];
  }, [availableQuotes]);

  const chapterOptions = useMemo(() => {
    const chapters = new Map<string, string>();
    availableQuotes.forEach((quote) => {
      if (quote.chapterSlug) chapters.set(quote.chapterSlug, quote.chapterTitle || quote.chapterSlug);
    });
    return [
      { id: "", name: "All chapters" },
      ...Array.from(chapters, ([id, name]) => ({ id, name })),
    ];
  }, [availableQuotes]);

  const ordered = useMemo(() => {
    const filtered = availableQuotes.filter(
      (quote) => (!character || characterValue(quote) === character) && (!chapter || quote.chapterSlug === chapter)
    );
    return sort === "newest" ? [...filtered].reverse() : filtered;
  }, [availableQuotes, chapter, character, sort]);

  const activeFilterCount = Number(Boolean(character)) + Number(Boolean(chapter));

  return <>
    <div className={styles.toolbar}>
      <div className={styles.toolbarRow}>
        <button
          type="button"
          className={`${styles.filterButton} ${filtersOpen ? styles.filterButtonActive : ""}`}
          aria-expanded={filtersOpen}
          aria-controls="echoes-filter-panel"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 4.5h14L11.7 10v4.2l-3.4 1.5V10L3 4.5Z" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
          </svg>
          <span>Filters</span>
          {activeFilterCount > 0 && <span className={styles.filterBadge}>{activeFilterCount}</span>}
        </button>
        <span className={styles.toolbarRule} aria-hidden="true" />
        <div className={styles.sortControl}>
          <span className={styles.sortLabel}>Sort</span>
          <div className={styles.sortSelect}>
            <Select
              value={sort}
              options={[
                { id: "newest", name: "Newest first" },
                { id: "oldest", name: "Oldest first" },
              ]}
              onChange={(value) => setSort(value as "newest" | "oldest")}
            />
          </div>
        </div>
      </div>

      {filtersOpen && (
        <div id="echoes-filter-panel" className={styles.filterPanel} role="group" aria-label="Filter echoes">
          <div className={styles.filterPanelHeading}>
            <span>Filter the archive</span>
            {activeFilterCount > 0 && <button type="button" onClick={() => { setCharacter(""); setChapter(""); }}>Clear</button>}
          </div>
          <div className={styles.filterGrid}>
            <label>
              <span>Character</span>
              <Select value={character} options={characterOptions} onChange={setCharacter} searchable />
            </label>
            <label>
              <span>Chapter</span>
              <Select value={chapter} options={chapterOptions} onChange={setChapter} searchable />
            </label>
          </div>
        </div>
      )}
    </div>
    <div className={recordsStyles.shelf} aria-live="polite">
      {ordered.map((quote, index) => <article id={`quote-${quote.chapterSlug}-${index + 1}`} className={recordsStyles.recordCard} key={`${quote.speakerId ?? quote.speakerName}-${quote.chapterSlug}-${index}`}><CharacterQuote quote={quote} showAttribution /></article>)}
      {ordered.length === 0 && <p className={styles.emptyState}>No echoes match these filters.</p>}
    </div>
  </>;
}
