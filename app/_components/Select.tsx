// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\_components\Select.tsx
"use client";

import { useState, useMemo, useEffect, useRef } from "react";

export type SelectOption = { id: string; name: string };

// Public-facing counterpart to app/admin/_components/SearchableSelect.tsx.
// Same visual language (see styles/common.css: .te-select-*), so a dropdown
// on /ravens-eye and a dropdown on /admin/tools no longer look like they
// came from two different sites.
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
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => (searchable ? options.filter((o) => o.name.toLowerCase().includes(q.toLowerCase())) : options),
    [options, q, searchable]
  );

  // Closing the dropdown — whether by selecting an option or by clicking
  // away — always clears the search text too, so reopening it never shows
  // a stale query from last time.
  const close = () => {
    setOpen(false);
    setQ("");
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = options.find((o) => o.id === value)?.name || placeholder;

  return (
    <div ref={ref} className="te-select">
      <div
        className={`te-select-trigger${open ? " te-select-trigger-open" : ""}`}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span className="te-select-value">{current}</span>
        <span className="te-select-caret">▼</span>
      </div>

      {open && (
        <div className="te-select-panel dropdown-enter custom-scroll">
          {searchable && (
            <div className="te-select-search-wrap">
              <input autoFocus placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          )}
          {filtered.length > 0 ? (
            filtered.map((opt) => (
              <div
                key={opt.id}
                className={`te-select-option${opt.id === value ? " te-select-option-active" : ""}`}
                onClick={() => {
                  onChange(opt.id);
                  close();
                }}
              >
                {opt.name}
              </div>
            ))
          ) : (
            <div className="te-select-empty">No results</div>
          )}
        </div>
      )}
    </div>
  );
}