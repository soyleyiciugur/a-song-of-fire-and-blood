"use client";

import { useState } from "react";
import Link from "next/link";
import SearchResultVisual from "@/components/search/SearchResultVisual";
import type { SearchResult } from "@/lib/search";
import styles from "./search.module.css";

export type SearchDisplayResult = Omit<SearchResult, "keywords">;

const INITIAL_RESULTS = 6;

export default function SearchResultGroup({ label, items }: { label: string; items: SearchDisplayResult[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, INITIAL_RESULTS);
  const remaining = items.length - INITIAL_RESULTS;

  return <section className={styles.group}>
    <h2 className={styles.groupHeading}><span>{label}</span><small>{items.length}</small></h2>
    <ul className={styles.list}>
      {visible.map((item) => <li key={`${item.type}-${item.id}`}>
        <Link href={item.href} className={styles.card}>
          <div className={styles.thumbnail}><SearchResultVisual item={item} size={44} /></div>
          <div className={styles.cardText}>
            <span className={styles.cardTitle}>{item.title}</span>
            {item.subtitle && <span className={styles.cardSubtitle}>{item.subtitle}</span>}
          </div>
        </Link>
      </li>)}
    </ul>
    {remaining > 0 && <button type="button" className={styles.showMore} onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
      {expanded ? "Show less" : `Show ${remaining} more ${label.toLowerCase()}`}
      <span aria-hidden="true">{expanded ? "↑" : "↓"}</span>
    </button>}
  </section>;
}
