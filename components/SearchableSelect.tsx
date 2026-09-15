// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\components\SearchableSelect.tsx
"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import styles from "./SearchableSelect.module.css";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  id?: string;
  "aria-label"?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  id,
  ...rest
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [placement, setPlacement] = useState<"down" | "up">("down");
  const [panelHeight, setPanelHeight] = useState(280);

  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const pointerMovedRef = useRef(false);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);


  const measurePanel = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const gutter = 12;
    const navHeight = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--site-nav-height")) || 58;
    const below = Math.max(0, window.innerHeight - rect.bottom - gutter);
    const above = Math.max(0, rect.top - Math.max(gutter, navHeight + gutter));
    const nextPlacement = below >= 220 || below >= above ? "down" : "up";
    const available = nextPlacement === "down" ? below : above;
    setPlacement(nextPlacement);
    setPanelHeight(Math.max(140, Math.min(320, available)));
  };


  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(Math.max(0, filtered.findIndex((o) => o.value === value)));
      requestAnimationFrame(() => searchRef.current?.focus());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const activeEl = listRef.current?.children[activeIndex] as
      | HTMLElement
      | undefined;
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const commit = (option: SearchableSelectOption) => {
    onChange(option.value);
    setQuery("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = filtered[activeIndex];
      if (option) commit(option);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        id={id}
        className={styles.trigger}
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            measurePanel();
            setOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={rest["aria-label"]}
      >
        <span className={selected ? styles.triggerValue : styles.triggerPlaceholder}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
          viewBox="0 0 12 8"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 1.5L6 6.5L11 1.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className={`${styles.panel} ${placement === "up" ? styles.panelUp : ""} dropdown-enter`}
          style={{ "--select-panel-max-height": `${panelHeight}px` } as CSSProperties}
          onKeyDown={handleKeyDown}
          onTouchMove={(event) => event.stopPropagation()}
        >
          <input
            ref={searchRef}
            type="text"
            className={styles.search}
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul
            ref={listRef}
            className={`${styles.list} custom-scroll`}
            role="listbox"
            onTouchMove={(event) => event.stopPropagation()}
          >
            {filtered.length === 0 && (
              <li className={styles.empty}>No matches</li>
            )}
            {filtered.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                className={`${styles.option} ${
                  index === activeIndex ? styles.optionActive : ""
                } ${option.value === value ? styles.optionSelected : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onPointerDown={(event) => {
                  pointerStartRef.current = { x: event.clientX, y: event.clientY };
                  pointerMovedRef.current = false;
                }}
                onPointerMove={(event) => {
                  const start = pointerStartRef.current;
                  if (!start) return;
                  if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 7) {
                    pointerMovedRef.current = true;
                  }
                }}
                onPointerUp={(event) => {
                  event.stopPropagation();
                  const shouldCommit = !pointerMovedRef.current;
                  pointerStartRef.current = null;
                  pointerMovedRef.current = false;
                  if (shouldCommit) commit(option);
                }}
                onPointerCancel={() => {
                  pointerStartRef.current = null;
                  pointerMovedRef.current = false;
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
