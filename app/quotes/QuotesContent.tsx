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

export default function QuotesContent({ quotes }: { quotes: Quote[] }) {
  const { progress, ready } = useReadingProgress();
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const ordered = useMemo(() => {
    const chapterQuotes = quotes.filter((quote) => quote.chapterSlug && (!ready || isWithinSpoilerBoundary(quote.chapterSlug, progress?.chapterSlug)));
    return sort === "newest" ? [...chapterQuotes].reverse() : chapterQuotes;
  }, [progress?.chapterSlug, quotes, ready, sort]);

  return <>
    <div className={styles.toolbar}>
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
    <div className={recordsStyles.shelf}>
      {ordered.map((quote, index) => <article id={`quote-${quote.chapterSlug}-${index + 1}`} className={recordsStyles.recordCard} key={`${quote.speakerId ?? quote.speakerName}-${quote.chapterSlug}-${index}`}><CharacterQuote quote={quote} showAttribution /></article>)}
    </div>
  </>;
}
