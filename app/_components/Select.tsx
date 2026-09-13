// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\_components\Select.tsx
"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";

export type SelectOption = { id: string; name: string };

export function Select({
  value,
  options,
  onChange,
  placeholder = "Select…",
  searchable = false,
}: {
  value: string;
  options: SelectOption[];
  onChange: (id: string) => void;
  placeholder?: string;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => (searchable ? options.filter((o) => o.name.toLowerCase().includes(q.toLowerCase())) : options),
    [options, q, searchable]
  );

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setSearchFocused(false);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [close]);

  useEffect(() => {
    if (!searchFocused) return;
    const viewport = window.visualViewport;
    let timer = 0;
    const reveal = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const input = searchRef.current;
        if (!input) return;
        const top = viewport?.offsetTop ?? 0;
        const bottom = top + (viewport?.height ?? window.innerHeight);
        const rect = input.getBoundingClientRect();
        if (rect.bottom > bottom - 18) {
          window.scrollBy({ top: rect.bottom - (bottom - 18), behavior: "smooth" });
        } else if (rect.top < top + 12) {
          window.scrollBy({ top: rect.top - (top + 12), behavior: "smooth" });
        }
      }, 20);
    };
    reveal();
    viewport?.addEventListener("resize", reveal);
    viewport?.addEventListener("scroll", reveal);
    return () => {
      window.clearTimeout(timer);
      viewport?.removeEventListener("resize", reveal);
      viewport?.removeEventListener("scroll", reveal);
    };
  }, [searchFocused]);

  const current = options.find((o) => o.id === value)?.name || placeholder;

  return (
    <div ref={ref} className={`te-select${open ? " te-select-open" : ""}`}>
      <button
        type="button"
        aria-expanded={open}
        className={`te-select-trigger${open ? " te-select-trigger-open" : ""}`}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span className="te-select-value">{current}</span>
        <span className="te-select-caret" aria-hidden="true">⌄</span>
      </button>

      {open && (
        <div className="te-select-panel dropdown-enter custom-scroll">
          {searchable && (
            <div className="te-select-search-wrap">
              <input
                ref={searchRef}
                placeholder="Search…"
                value={q}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          )}
          {filtered.length > 0 ? (
            filtered.map((opt) => (
              <button
                type="button"
                key={opt.id}
                className={`te-select-option${opt.id === value ? " te-select-option-active" : ""}`}
                onClick={() => {
                  onChange(opt.id);
                  close();
                }}
              >
                {opt.name}
              </button>
            ))
          ) : (
            <div className="te-select-empty">No results</div>
          )}
        </div>
      )}
    </div>
  );
}
