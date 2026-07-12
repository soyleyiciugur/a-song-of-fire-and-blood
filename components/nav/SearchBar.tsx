// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\components\nav\SearchBar.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { searchIndex, type SearchResult } from "@/lib/search";

import styles from "./navbar.module.css";

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  character: "Characters",
  chapter: "Chapters",
  house: "Houses",
  dragon: "Dragons",
};

const TYPE_ORDER: SearchResult["type"][] = ["character", "chapter", "house", "dragon"];

function groupResults(results: SearchResult[]) {
  const groups = new Map<SearchResult["type"], SearchResult[]>();

  for (const type of TYPE_ORDER) groups.set(type, []);

  for (const result of results) {
    groups.get(result.type)?.push(result);
  }

  return TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    items: groups.get(type) ?? [],
  })).filter((group) => group.items.length > 0);
}

export default function SearchBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => searchIndex(query, 8), [query]);
  const grouped = useMemo(() => groupResults(results), [results]);

  function goToSearchPage() {
    setOpen(false);
    inputRef.current?.blur();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className={styles.searchWrap}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder="Search the realm..."
        className={styles.searchInput}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query.trim()) setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim()) {
            goToSearchPage();
          }
          if (e.key === "Escape") {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
      />

      {open && query.trim() && (
        <div
          className={styles.dropdown}
          onMouseDown={(e) => e.preventDefault()}
        >
          {grouped.length === 0 ? (
            <p className={styles.noResults}>No matches yet.</p>
          ) : (
            <>
              {grouped.map((group) => (
                <div key={group.type} className={styles.group}>
                  <p className={styles.groupLabel}>{group.label}</p>

                  {group.items.map((item) => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.href}
                      className={styles.resultItem}
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className={styles.resultTitle}>{item.title}</span>

                      {item.subtitle && (
                        <span className={styles.resultSubtitle}>{item.subtitle}</span>
                      )}
                    </Link>
                  ))}
                </div>
              ))}

              <button type="button" className={styles.seeAll} onClick={goToSearchPage}>
                See all results for <q>{query.trim()}</q>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
