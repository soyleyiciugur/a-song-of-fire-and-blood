// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\admin\ravens-eye\page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import galleryData from "@/data/gallery.json";
import charactersData from "@/data/characters/characters.json";
import housesData from "@/data/houses.json";
import dragonsData from "@/data/dragons.json";
import chaptersData from "@/data/chapters/chapters.json";
import { ConfirmModal } from "../_components/Modal";
import { getDraft, setDraft } from "@/lib/adminDrafts";

// ── Types ──────────────────────────────────────────────────────────────────

interface WorldDate { day: number; moon: number; year: number; era: string; }
interface GalleryEntry {
  id: string;
  src: string;
  caption: string;
  characterIds: string[];
  houseIds: string[];
  dragonIds: string[];
  chapterId: string | null;
  worldDate: WorldDate | null;
  uploadedAt: string;
  // Which section of /ravens-eye this shows up in. Undefined/"raven" = the
  // serious archive (default). "fleabottom" = the meme section.
  category?: "raven" | "fleabottom";
}

type NamedItem = { id: string; name: string };

// ── Helpers ────────────────────────────────────────────────────────────────

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatDate(d: WorldDate) {
  return `${ordinal(d.day)} of the ${ordinal(d.moon)} Moon, ${d.year} ${d.era}`;
}

function newId() {
  return "gallery-" + Date.now().toString(36);
}

// ── Shared UI Components & Styles ──────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase",
  letterSpacing: "1px", marginBottom: "8px", display: "block", fontWeight: 600,
};

// Themed checkbox to match the rest of the admin UI
const Checkbox = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none" }}
  >
    <div
      style={{
        width: "18px", height: "18px", borderRadius: "4px", flexShrink: 0,
        border: checked ? "1px solid var(--gold)" : "1px solid var(--border)",
        background: checked ? "var(--gold)" : "rgba(0,0,0,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}
    >
      {checked && (
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
          <path d="M1 4.5L4 7.5L10 1.5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
    <span style={{ fontSize: "0.9rem", color: "var(--text)" }}>{label}</span>
  </div>
);

// Two-way segmented control — matches the Gender/Mode toggles on
// admin/tools/page.tsx so this editor doesn't invent a third way to
// present a binary choice.
const SegmentedControl = ({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) => (
  <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
    {options.map((opt) => (
      <button
        key={opt.id}
        type="button"
        onClick={() => onChange(opt.id)}
        style={{
          flex: 1,
          padding: "10px 12px",
          background: value === opt.id ? "var(--gold)" : "transparent",
          color: value === opt.id ? "#000" : "var(--text)",
          border: "none",
          cursor: "pointer",
          fontWeight: value === opt.id ? "bold" : "normal",
          fontFamily: "inherit",
          fontSize: "0.9rem",
          transition: "all 0.15s",
        }}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

// Small pill shown next to sidebar entries so Flea Bottom items are
// distinguishable from the archive at a glance while browsing the list.
const CategoryTag = ({ category }: { category?: GalleryEntry["category"] }) => {
  if (category !== "fleabottom") return null;
  return (
    <span style={{
      display: "inline-block", marginTop: "2px", padding: "1px 6px",
      fontSize: "0.65rem", letterSpacing: "0.4px", textTransform: "uppercase",
      color: "var(--muted)", border: "1px solid var(--border)", borderRadius: "999px",
    }}>
      Flea Bottom
    </span>
  );
};

// ── Multi-select Tag Picker ────────────────────────────────────────────────

function TagPicker({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: NamedItem[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = options.filter((o) => o.name.toLowerCase().includes(q.toLowerCase()));
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={labelStyle}>{label}</div>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", flexWrap: "wrap", gap: "6px",
          minHeight: "46px", alignItems: "center", cursor: "pointer",
          background: "rgba(0,0,0,0.2)",
          border: open ? "1px solid var(--gold)" : "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: "8px 12px",
          transition: "border-color 0.2s ease, background 0.2s ease",
        }}
      >
        {selected.length === 0 && (
          <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>None selected…</span>
        )}
        {selected.map((id) => {
          const name = options.find((o) => o.id === id)?.name ?? id;
          return (
            <span
              key={id}
              onClick={(e) => { e.stopPropagation(); toggle(id); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                padding: "4px 10px", borderRadius: "20px",
                background: "rgba(194,162,39,0.15)", border: "1px solid rgba(194,162,39,0.3)",
                color: "var(--gold)", fontSize: "0.8rem", cursor: "pointer",
              }}
            >
              {name} <span style={{ opacity: 0.6, fontSize: "0.7rem" }}>✕</span>
            </span>
          );
        })}
        <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: "10px", flexShrink: 0 }}>▼</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
          background: "var(--surface)", border: `1px solid var(--border)`,
          borderRadius: "var(--radius-sm)", maxHeight: "220px", overflowY: "auto",
          boxShadow: "var(--shadow-card)",
        }}>
          <div style={{ padding: "8px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--surface)" }}>
            <input
              autoFocus value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              style={{ padding: "8px 12px" }}
            />
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: "12px", color: "var(--muted)", textAlign: "center", fontSize: "0.9rem" }}>No results</div>
          )}
          {filtered.map((o) => (
            <div
              key={o.id}
              onClick={() => toggle(o.id)}
              style={{
                padding: "10px 12px", cursor: "pointer", fontSize: "0.9rem",
                display: "flex", alignItems: "center", gap: "10px",
                borderBottom: "1px solid var(--border)",
                background: selected.includes(o.id) ? "var(--surface-hover)" : "transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = selected.includes(o.id) ? "var(--surface-hover)" : "transparent"; }}
            >
              <span style={{
                width: "16px", height: "16px", borderRadius: "3px", flexShrink: 0,
                border: selected.includes(o.id) ? "1px solid var(--gold)" : "1px solid var(--border)",
                background: selected.includes(o.id) ? "var(--gold)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#000",
              }}>
                {selected.includes(o.id) && (
                  <svg width="10" height="8" viewBox="0 0 11 9" fill="none">
                    <path d="M1 4.5L4 7.5L10 1.5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span style={{ color: selected.includes(o.id) ? "var(--gold)" : "var(--text)" }}>{o.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

const characters = (charactersData as NamedItem[]);
const houses = (housesData as NamedItem[]);
const dragons = (dragonsData as NamedItem[]);
const chapters = (chaptersData as { slug: string; title: string }[]);

export default function AdminRavensEyePage() {
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [hasDateOverride, setHasDateOverride] = useState(false);

  // Load from draft or source data
  useEffect(() => {
    const draft = getDraft<GalleryEntry[]>("gallery");
    const loaded = draft ?? (galleryData as unknown as GalleryEntry[]);
    setEntries(loaded);
    if (loaded.length > 0) setSelectedId(loaded[0].id);
  }, []);

  // Persist draft on every change
  useEffect(() => {
    if (entries.length === 0) return;
    setDraft("gallery", entries);
  }, [entries]);

  const entry = entries.find((e) => e.id === selectedId) ?? null;

  // Sync date override toggle when switching entries
  useEffect(() => {
    setHasDateOverride(entry?.worldDate != null);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (fields: Partial<GalleryEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === selectedId ? { ...e, ...fields } : e)));
  };

  const handleAdd = () => {
    const id = newId();
    const now = new Date().toISOString().slice(0, 10);
    const newEntry: GalleryEntry = {
      id,
      src: "",
      caption: "",
      characterIds: [],
      houseIds: [],
      dragonIds: [],
      chapterId: null,
      worldDate: null,
      uploadedAt: now,
      category: "raven",
    };
    setEntries((prev) => [newEntry, ...prev]);
    setSelectedId(id);
  };

  const handleDelete = () => {
    setEntries((prev) => prev.filter((e) => e.id !== selectedId));
    setSelectedId(entries.find((e) => e.id !== selectedId)?.id ?? null);
    setShowDeleteModal(false);
    notify("Entry deleted from draft.", "success");
  };

  const notify = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleDate = (enabled: boolean) => {
    setHasDateOverride(enabled);
    if (!enabled) patch({ worldDate: null });
    else patch({ worldDate: { day: 1, moon: 1, year: 99, era: "AC" } });
  };

  if (entries.length === 0) {
    return (
      <div style={{ padding: "3rem 2rem", textAlign: "center", color: "var(--muted)" }}>
        No entries yet.{" "}
        <button onClick={handleAdd} style={{ color: "var(--gold)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
          Add the first one
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 65px)", overflow: "hidden" }}>

      {/* ── Left sidebar: entry list ── */}
      <div style={{
        width: "260px", flexShrink: 0,
        borderRight: "1px solid var(--border)",
        background: "var(--background)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{
          padding: "16px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
          <button
            onClick={handleAdd}
            style={{
              fontSize: "0.8rem", color: "var(--gold)", background: "transparent",
              border: "1px solid var(--gold)", padding: "6px 12px", borderRadius: "4px", cursor: "pointer",
            }}
          >
            + Add
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {entries.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelectedId(e.id)}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                width: "100%", padding: "12px 16px",
                background: e.id === selectedId ? "var(--surface-hover)" : "transparent",
                border: "none", borderBottom: "1px solid var(--border)",
                borderLeft: e.id === selectedId ? "2px solid var(--gold)" : "2px solid transparent",
                cursor: "pointer", textAlign: "left", color: "var(--text)",
                transition: "background 0.15s",
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: "44px", height: "44px", flexShrink: 0, borderRadius: "var(--radius-sm)",
                overflow: "hidden", background: "var(--surface)",
                border: "1px solid var(--border)",
              }}>
                {e.src && (
                  <img src={e.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: "0.9rem", fontWeight: e.id === selectedId ? "bold" : "normal",
                  color: e.id === selectedId ? "var(--gold)" : "var(--text)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {e.caption || <span style={{ color: "var(--muted)" }}>Untitled</span>}
                </div>
                {e.src && (
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>
                    {e.src.split("/").pop()}
                  </div>
                )}
                <CategoryTag category={e.category} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: edit panel ── */}
      {entry ? (
        <div style={{ flex: 1, overflowY: "auto", padding: "32px", background: "var(--surface)" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid var(--border)" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.5rem", color: "var(--gold)" }}>
                  {entry.caption || "Untitled Entry"}
                </h2>
                <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "4px", fontFamily: "monospace" }}>{entry.id}</div>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  background: "transparent", color: "#ff4c4c", border: "1px solid #ff4c4c",
                  padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontSize: "0.9rem",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 76, 76, 0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                Delete
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

              {/* Section: Raven's Eye vs Flea Bottom */}
              <div>
                <div style={labelStyle}>Section</div>
                <SegmentedControl
                  options={[
                    { id: "raven", label: "Raven's Eye" },
                    { id: "fleabottom", label: "Flea Bottom Memes" },
                  ]}
                  value={entry.category === "fleabottom" ? "fleabottom" : "raven"}
                  onChange={(v) => patch({ category: v as GalleryEntry["category"] })}
                />
              </div>

              {/* Image path */}
              <div>
                <div style={labelStyle}>Image path (relative to /public)</div>
                <input
                  value={entry.src}
                  onChange={(e) => patch({ src: e.target.value })}
                  placeholder="/images/gallery/my-image.jpg"
                />
                {entry.src && (
                  <div style={{ marginTop: "16px", borderRadius: "var(--radius-sm)", overflow: "hidden", maxHeight: "280px", border: "1px solid var(--border)", background: "rgba(0,0,0,0.3)" }}>
                    <img
                      src={entry.src} alt="preview"
                      style={{ display: "block", width: "100%", maxHeight: "280px", objectFit: "contain" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
              </div>

              {/* Caption */}
              <div>
                <div style={labelStyle}>Caption <span style={{ opacity: 0.5, textTransform: "none", fontWeight: "normal" }}>(optional)</span></div>
                <textarea
                  value={entry.caption}
                  onChange={(e) => patch({ caption: e.target.value })}
                  rows={3}
                  style={{ resize: "vertical", lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                {/* Characters */}
                <TagPicker
                  label="Characters"
                  options={characters}
                  selected={entry.characterIds}
                  onChange={(ids) => patch({ characterIds: ids })}
                />

                {/* Houses */}
                <TagPicker
                  label="Houses"
                  options={houses}
                  selected={entry.houseIds}
                  onChange={(ids) => patch({ houseIds: ids })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                {/* Dragons */}
                <TagPicker
                  label="Dragons"
                  options={dragons}
                  selected={entry.dragonIds}
                  onChange={(ids) => patch({ dragonIds: ids })}
                />

                {/* Chapter */}
                <div>
                  <div style={labelStyle}>Chapter <span style={{ opacity: 0.5, textTransform: "none", fontWeight: "normal" }}>(optional)</span></div>
                  <select
                    value={entry.chapterId ?? ""}
                    onChange={(e) => patch({ chapterId: e.target.value || null })}
                    style={{
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text)",
                      padding: "10px 12px",
                      width: "100%",
                    }}
                  >
                    <option value="">— None —</option>
                    {chapters.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* In-world date */}
              <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: hasDateOverride ? "16px" : "0" }}>
                  <div style={{ ...labelStyle, marginBottom: 0 }}>In-World Date</div>
                  <Checkbox
                    checked={hasDateOverride}
                    onChange={toggleDate}
                    label={hasDateOverride ? "Enabled" : "Enable"}
                  />
                </div>
                
                {hasDateOverride && entry.worldDate && (
                  <>
                    <div style={{
                      display: "grid", gridTemplateColumns: "1fr 1fr 1fr 80px",
                      gap: "12px", marginBottom: "12px",
                    }}>
                      <div>
                        <div style={labelStyle}>Day</div>
                        <input
                          type="number" min={1} max={30}
                          value={entry.worldDate.day}
                          onChange={(e) => patch({ worldDate: { ...entry.worldDate!, day: Math.min(30, Math.max(1, Number(e.target.value))) } })}
                        />
                      </div>
                      <div>
                        <div style={labelStyle}>Moon</div>
                        <input
                          type="number" min={1} max={12}
                          value={entry.worldDate.moon}
                          onChange={(e) => patch({ worldDate: { ...entry.worldDate!, moon: Math.min(12, Math.max(1, Number(e.target.value))) } })}
                        />
                      </div>
                      <div>
                        <div style={labelStyle}>Year</div>
                        <input
                          type="number" min={1}
                          value={entry.worldDate.year}
                          onChange={(e) => patch({ worldDate: { ...entry.worldDate!, year: Math.max(1, Number(e.target.value)) } })}
                        />
                      </div>
                      <div>
                        <div style={labelStyle}>Era</div>
                        <select
                          value={entry.chapterId ?? ""}
                          onChange={(e) => patch({ chapterId: e.target.value || null })}
                          style={{
                            background: "rgba(0,0,0,0.2)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--text)",
                            padding: "10px 12px",
                            width: "100%",
                          }}
                        >
                          <option value="AC">AC</option>
                          <option value="BC">BC</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ color: "var(--gold)", fontSize: "0.9rem", fontStyle: "italic" }}>
                      ↳ {formatDate(entry.worldDate)}
                    </div>
                  </>
                )}
              </div>

              {/* Upload date (meta) */}
              <div>
                <div style={labelStyle}>Added on (YYYY-MM-DD)</div>
                <input
                  type="date"
                  value={entry.uploadedAt}
                  onChange={(e) => patch({ uploadedAt: e.target.value })}
                  style={{ colorScheme: "dark", maxWidth: "200px" }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", background: "var(--surface)" }}>
          Select an entry to edit.
        </div>
      )}

      {/* Modals & notifications */}
      {showDeleteModal && (
        <ConfirmModal
          title="Delete Entry"
          message={`Remove "${entry?.caption || "this entry"}" from the gallery?\n\nThe image file itself will not be deleted.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {notification && (
        <div style={{
          position: "fixed", bottom: "30px", right: "30px",
          background: notification.type === "success" ? "rgba(30,80,40,0.95)" : "rgba(139,0,0,0.95)",
          color: "#fff", padding: "16px 24px", borderRadius: "var(--radius-sm)",
          border: `1px solid ${notification.type === "success" ? "#2e8b57" : "#ff4c4c"}`,
          boxShadow: "var(--shadow-card)", display: "flex", alignItems: "center",
          gap: "12px", zIndex: 2000, fontSize: "0.95rem", fontWeight: "bold",
        }}>
          {notification.type === "success" ? "✓" : "⚠"} {notification.message}
        </div>
      )}
    </div>
  );
}