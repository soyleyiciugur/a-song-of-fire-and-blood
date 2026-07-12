// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\components\SearchableSelect.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

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
        onClick={() => setOpen((o) => !o)}
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
        <div className={`${styles.panel} dropdown-enter`} onKeyDown={handleKeyDown}>
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
                onClick={() => commit(option)}
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
