"use client";

import { useMemo, useState } from "react";
import { Select } from "@/app/_components/Select";
import CharacterQuote from "@/components/character/CharacterQuote";
import recordsStyles from "../records/records.module.css";
import styles from "./quotes.module.css";

type Quote = {
  text: string;
  speakerId?: string;
  speakerName: string;
  chapterSlug?: string | null;
  chapterTitle?: string | null;
  note?: string | null;
};

export default function QuotesContent({ quotes }: { quotes: Quote[] }) {
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const ordered = useMemo(() => {
    const chapterQuotes = quotes.filter((quote) => quote.chapterSlug);
    return sort === "newest" ? [...chapterQuotes].reverse() : chapterQuotes;
  }, [quotes, sort]);

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
      {ordered.map((quote, index) => <article className={recordsStyles.recordCard} key={`${quote.speakerId ?? quote.speakerName}-${quote.chapterSlug}-${index}`}><CharacterQuote quote={quote} showAttribution /></article>)}
    </div>
  </>;
}
