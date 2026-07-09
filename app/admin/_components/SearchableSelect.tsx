"use client";

import { useState, useMemo, useEffect, useRef } from "react";

export const SearchableSelect = ({
  value,
  options,
  onChange,
  label,
  placeholder = "Select...",
  searchable = true,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => (searchable ? options.filter((o: any) => o.name.toLowerCase().includes(search.toLowerCase())) : options),
    [options, search, searchable]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
      {label && <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>{label}</span>}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: isOpen ? "1px solid var(--gold)" : "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s" }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {options.find((o: any) => o.id === value)?.name || placeholder}
        </span>
        <span style={{ fontSize: "10px", opacity: 0.5 }}>▼</span>
      </div>

      {isOpen && (
        <div className="custom-scroll dropdown-enter" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "var(--surface)", border: "1px solid var(--border)", marginTop: "4px", borderRadius: "6px", maxHeight: "220px", overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
          {searchable && (
            <div style={{ padding: "8px", position: "sticky", top: 0, background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
              <input autoFocus placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text)", borderRadius: "4px", outline: "none", fontFamily: "inherit" }} />
            </div>
          )}
          {filtered.length > 0 ? filtered.map((opt: any) => (
            <div key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); setSearch(""); }} style={{ padding: "10px 12px", cursor: "pointer", transition: "background 0.15s", borderBottom: "1px solid rgba(255,255,255,0.05)" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              {opt.name}
            </div>
          )) : <div style={{ padding: "12px", opacity: 0.5, textAlign: "center" }}>No results found</div>}
        </div>
      )}
    </div>
  );
};