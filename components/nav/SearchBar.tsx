"use client";

import UtilityIcon from "./UtilityIcon";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/lib/search";
import SearchResultVisual from "@/components/search/SearchResultVisual";
import styles from "./navbar.module.css";

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  character: "Characters", chapter: "Chapters", house: "Houses", dragon: "Dragons",
  event: "Events", location: "Locations", artifact: "Artifacts", gallery: "Raven's Eye",
  quote: "Quotes", scroll: "Scrolls", brother: "Book of Brothers", bloodshed: "The Bloodshed",
  forum: "Taverns", bestiary: "Bestiary", card: "The Great Game", page: "Destinations", update: "Update Notes",
};

export default function SearchBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  const grouped = useMemo(() => {
    const groups = new Map<SearchResult["type"], SearchResult[]>();
    for (const result of results) groups.set(result.type, [...(groups.get(result.type) ?? []), result]);
    return [...groups].map(([type, items]) => ({ type, label: TYPE_LABELS[type], items }));
  }, [results]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onEscape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onEscape);
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onEscape); };
  }, [open]);

  useEffect(() => {
    const value = query.trim();
    if (!value) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`, { signal: controller.signal });
        const payload = await response.json() as { results?: SearchResult[] };
        if (response.ok) { setResults(payload.results ?? []); setActive(0); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 120);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  function close() {
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  function navigate(href: string) {
    close();
    router.push(href);
  }

  function showAll() {
    const value = query.trim();
    if (value) navigate(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <div className={`${styles.searchWrap} ${styles.commandSearch}`}>
      <button type="button" className={styles.commandTrigger} onClick={() => setOpen(true)} aria-label="Search the realm" aria-haspopup="dialog">
        <UtilityIcon name="search" className={styles.commandTriggerIcon} />
        <span className={styles.commandTriggerLabel}>Search</span>
        <kbd className={styles.commandShortcut}>⌘K</kbd>
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div className={styles.commandLayer} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <section className={styles.commandPalette} role="dialog" aria-modal="true" aria-label="Search the realm">
            <div className={styles.commandInputRow}>
              <UtilityIcon name="search" className={styles.commandInputIcon} />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  const value = event.target.value;
                  setQuery(value);
                  if (!value.trim()) { setResults([]); setLoading(false); setActive(0); }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") { event.preventDefault(); close(); }
                  if (event.key === "ArrowDown" && results.length) { event.preventDefault(); setActive((value) => (value + 1) % results.length); }
                  if (event.key === "ArrowUp" && results.length) { event.preventDefault(); setActive((value) => (value - 1 + results.length) % results.length); }
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (results[active]) navigate(results[active].href);
                    else showAll();
                  }
                }}
                className={styles.commandInput}
                placeholder="Search characters, chapters, quotes, Raven's Eye…"
                aria-label="Search query"
                aria-controls="realm-search-results"
                aria-activedescendant={results[active] ? `search-result-${active}` : undefined}
                autoComplete="off"
                spellCheck={false}
              />
              {loading && <span className={styles.commandLoading} role="status">Searching…</span>}
              <button type="button" className={styles.commandClose} onClick={close} aria-label="Close search"><span className={styles.commandCloseDesktop}>Esc</span><span className={styles.commandCloseMobile} aria-hidden="true">×</span></button>
            </div>

            <div className={styles.commandResults} id="realm-search-results" role="listbox">
              {!query.trim() ? (
                <div className={styles.commandHint}><span>Search the public archives across the whole realm.</span><small>Use ↑ ↓ to move · Enter to open</small></div>
              ) : !loading && results.length === 0 ? (
                <p className={styles.commandEmpty}>Nothing in the records matches <q>{query.trim()}</q>.</p>
              ) : (
                grouped.map((group) => (
                  <div className={styles.commandGroup} key={group.type}>
                    <p className={styles.commandGroupLabel}>{group.label}</p>
                    {group.items.map((item) => {
                      const index = results.indexOf(item);
                      return <button key={`${item.type}-${item.id}`} id={`search-result-${index}`} type="button" role="option" aria-selected={active === index}
                        className={`${styles.commandResult} ${active === index ? styles.commandResultActive : ""}`}
                        onMouseEnter={() => setActive(index)} onClick={() => navigate(item.href)}>
                        <span className={styles.commandResultMark} aria-hidden="true"><SearchResultVisual item={item} size={34} /></span>
                        <span className={styles.commandResultText}><strong>{item.title}</strong>{item.subtitle && <small>{item.subtitle}</small>}</span>
                        <span className={styles.commandResultType}>{group.label}</span>
                      </button>;
                    })}
                  </div>
                ))
              )}
            </div>

            {query.trim() && results.length > 0 && <button type="button" className={styles.commandAll} onClick={showAll}>View all results for <q>{query.trim()}</q><span>↵</span></button>}
          </section>
        </div>, document.body
      )}
    </div>
  );
}
