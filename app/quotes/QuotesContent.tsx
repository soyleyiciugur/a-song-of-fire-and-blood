"use client";

import { useMemo, useState } from "react";
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
      <label htmlFor="echo-sort">Sort</label>
      <select id="echo-sort" value={sort} onChange={(event) => setSort(event.target.value as "newest" | "oldest")}>
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>
    </div>
    <div className={recordsStyles.shelf}>
      {ordered.map((quote, index) => <article className={recordsStyles.recordCard} key={`${quote.speakerId ?? quote.speakerName}-${quote.chapterSlug}-${index}`}><CharacterQuote quote={quote} showAttribution /></article>)}
    </div>
  </>;
}
