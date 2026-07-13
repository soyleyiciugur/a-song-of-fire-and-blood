// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\admin\ravens-eye\page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import galleryData from "@/data/gallery.json";
import charactersData from "@/data/characters/characters.json";
import housesData from "@/data/houses.json";
import dragonsData from "@/data/dragons.json";
import chaptersData from "@/data/chapters/chapters.json";
import { ConfirmModal } from "../_components/Modal";
import { Select } from "../../_components/Select";
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
  category?: "raven" | "fleabottom";
}

type NamedItem = { id: string; name: string };
type MediaTab = "image" | "video";

// ── Media helpers — video vs image is derived from the src extension, not
//    stored as a separate field. Prefix is implicit: images always live
//    under /images/gallery/, videos under /videos/reels/. ─────────────────

const IMAGE_PREFIX = "/images/gallery/";
const VIDEO_PREFIX = "/videos/reels/";
const VIDEO_EXT = [".mp4", ".webm", ".mov"];


function isVideoSrc(src: string) {
  // Prefix, dosya adı henüz girilmemiş olsa bile hangi tab'a ait olduğunu
  // kesin olarak belirtir — yeni eklenen boş entry'ler bu sayede kaybolmaz.
  if (src.startsWith(VIDEO_PREFIX)) return true;
  if (src.startsWith(IMAGE_PREFIX)) return false;
  // Prefix yoksa (eski veri, elle girilmiş src vs.) uzantıya bak.
  const lower = src.toLowerCase();
  return VIDEO_EXT.some((ext) => lower.endsWith(ext));
}

function stripKnownPrefix(src: string) {
  if (src.startsWith(IMAGE_PREFIX)) return src.slice(IMAGE_PREFIX.length);
  if (src.startsWith(VIDEO_PREFIX)) return src.slice(VIDEO_PREFIX.length);
  return src;
}

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

// ── Media path input — prefix-locked field. Type (image/video) is now
//    decided by which top-level tab you're in, not chosen inline here. ────

function SrcInput({ mediaType, value, onChange }: { mediaType: MediaTab; value: string; onChange: (v: string) => void }) {
  const prefix = mediaType === "video" ? VIDEO_PREFIX : IMAGE_PREFIX;
  const filename = stripKnownPrefix(value);

  return (
    <div style={{
      display: "flex", alignItems: "center",
      border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
      background: "rgba(0,0,0,0.2)", overflow: "hidden",
    }}>
      <span style={{ padding: "0 0 0 12px", color: "var(--muted)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
        {prefix}
      </span>
      <input
        value={filename}
        onChange={(e) => onChange(`${prefix}${e.target.value}`)}
        placeholder={mediaType === "video" ? "my-clip.mp4" : "my-image.jpg"}
        style={{ border: "none", background: "transparent", flex: 1 }}
      />
    </div>
  );
}

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
  const [hovered, setHovered] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQ("");
      }
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
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", flexWrap: "wrap", gap: "6px",
          minHeight: "46px", alignItems: "center", cursor: "pointer",
          background: "rgba(0,0,0,0.2)",
          border: (open || hovered) ? "1px solid var(--gold)" : "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: "8px 12px",
          transition: "border-color 0.2s ease, background 0.2s ease",
          boxSizing: "border-box",
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

// TagPicker'ın hemen altına ekle — tek seçimli versiyon

function SingleSelectPicker({
  label,
  options,
  selected,
  onChange,
  allowNone = true,
}: {
  label: string;
  options: NamedItem[];
  selected: string;
  onChange: (id: string) => void;
  allowNone?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQ("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = options.filter((o) => o.name.toLowerCase().includes(q.toLowerCase()));
  const selectedName = options.find((o) => o.id === selected)?.name;

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQ("");
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={labelStyle}>{label}</div>
      <div
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", alignItems: "center",
          minHeight: "46px", cursor: "pointer",
          background: "rgba(0,0,0,0.2)",
          border: (open || hovered) ? "1px solid var(--gold)" : "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: "8px 12px",
          transition: "border-color 0.2s ease, background 0.2s ease",
          boxSizing: "border-box",
        }}
      >
        <span style={{ color: selectedName ? "var(--text)" : "var(--muted)", fontSize: "0.9rem", flex: 1 }}>
          {selectedName ?? "None selected…"}
        </span>
        <span style={{ color: "var(--muted)", fontSize: "10px", flexShrink: 0 }}>▼</span>
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
          {allowNone && (
            <div
              onClick={() => pick("")}
              style={{
                padding: "10px 12px", cursor: "pointer", fontSize: "0.9rem",
                borderBottom: "1px solid var(--border)",
                color: selected === "" ? "var(--gold)" : "var(--muted)",
                fontStyle: "italic",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              — None —
            </div>
          )}
          {filtered.length === 0 && (
            <div style={{ padding: "12px", color: "var(--muted)", textAlign: "center", fontSize: "0.9rem" }}>No results</div>
          )}
          {filtered.map((o) => (
            <div
              key={o.id}
              onClick={() => pick(o.id)}
              style={{
                padding: "10px 12px", cursor: "pointer", fontSize: "0.9rem",
                display: "flex", alignItems: "center", gap: "10px",
                borderBottom: "1px solid var(--border)",
                background: selected === o.id ? "var(--surface-hover)" : "transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = selected === o.id ? "var(--surface-hover)" : "transparent"; }}
            >
              <span style={{ color: selected === o.id ? "var(--gold)" : "var(--text)" }}>{o.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared data ──────────────────────────────────────────────────────────

const characters = (charactersData as NamedItem[]);
const houses = (housesData as NamedItem[]);
const dragons = (dragonsData as NamedItem[]);
const chapters = (chaptersData as { slug: string; title: string }[]);

const chapterOptions = [
  { id: "", name: "— None —" },
  ...chapters.map((c) => ({ id: c.slug, name: c.title })),
];
const eraOptions = [
  { id: "AC", name: "AC" },
  { id: "BC", name: "BC" },
];

// ── One tab's worth of UI (Images or Videos) — sidebar + edit panel,
//    scoped to whichever slice of `entries` matches its mediaType. Mirrors
//    LocationsTab / PositionsTab on admin/map/page.tsx: same component
//    shape reused for both tabs, just fed a different pool + mediaType. ────

function GalleryMediaTab({
  mediaType,
  entries,
  setEntries,
}: {
  mediaType: MediaTab;
  entries: GalleryEntry[];
  setEntries: React.Dispatch<React.SetStateAction<GalleryEntry[]>>;
}) {
  const scoped = entries.filter((e) => isVideoSrc(e.src) === (mediaType === "video"));
  const [selectedId, setSelectedId] = useState<string | null>(scoped[0]?.id ?? null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [hasDateOverride, setHasDateOverride] = useState(false);

  useEffect(() => {
    if (!scoped.some((e) => e.id === selectedId)) {
      setSelectedId(scoped[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType]);

  const entry = scoped.find((e) => e.id === selectedId) ?? null;

  useEffect(() => {
    setHasDateOverride(entry?.worldDate != null);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const notify = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const patch = (fields: Partial<GalleryEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === selectedId ? { ...e, ...fields } : e)));
  };

  const handleAdd = () => {
    const id = newId();
    const now = new Date().toISOString().slice(0, 10);
    const newEntry: GalleryEntry = {
      id,
      src: mediaType === "video" ? VIDEO_PREFIX : IMAGE_PREFIX,
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
    setShowDeleteModal(false);
    notify("Entry deleted from draft.", "success");
  };

  const toggleDate = (enabled: boolean) => {
    setHasDateOverride(enabled);
    if (!enabled) patch({ worldDate: null });
    else patch({ worldDate: { day: 1, moon: 1, year: 99, era: "AC" } });
  };

  if (scoped.length === 0) {
    return (
      <div style={{ padding: "3rem 2rem", textAlign: "center", color: "var(--muted)" }}>
        No {mediaType === "video" ? "videos" : "images"} yet.{" "}
        <button onClick={handleAdd} style={{ color: "var(--gold)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
          Add the first one
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 140px)" }}>

      {/* ── Left sidebar: entry list ── */}
      <div style={{
        width: "260px", flexShrink: 0,
        borderRight: "1px solid var(--border)",
        background: "var(--background)",
        display: "flex", flexDirection: "column",
        position: "sticky", top: "140px", height: "calc(100vh - 140px)", overflow: "hidden",
      }}>
        <div style={{
          padding: "16px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
            {scoped.length} {scoped.length === 1 ? "entry" : "entries"}
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
          {scoped.map((e) => (
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
              <div style={{
                width: "44px", height: "44px", flexShrink: 0, borderRadius: "var(--radius-sm)",
                overflow: "hidden", background: "var(--surface)",
                border: "1px solid var(--border)",
              }}>
                {e.src && (
                  mediaType === "video" ? (
                    <video src={e.src} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <img src={e.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )
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
        <div style={{ flex: 1, padding: "32px", background: "var(--surface)" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>

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

              {mediaType === "image" && (
                <div>
                  <div style={labelStyle}>Section</div>
                  <SegmentedControl
                    options={[
                      { id: "raven", label: "The Raven's Eye" },
                      { id: "fleabottom", label: "Memes from the Gutters of Flea Bottom" },
                    ]}
                    value={entry.category === "fleabottom" ? "fleabottom" : "raven"}
                    onChange={(v) => patch({ category: v as GalleryEntry["category"] })}
                  />
                </div>
              )}

              <div>
                <div style={labelStyle}>{mediaType === "video" ? "Video file" : "Image path"} (relative to /public)</div>
                <SrcInput mediaType={mediaType} value={entry.src} onChange={(v) => patch({ src: v })} />
                {entry.src && stripKnownPrefix(entry.src) && (
                  <div style={{ marginTop: "16px", borderRadius: "var(--radius-sm)", overflow: "hidden", maxHeight: "280px", border: "1px solid var(--border)", background: "rgba(0,0,0,0.3)" }}>
                    {mediaType === "video" ? (
                      <video src={entry.src} controls style={{ display: "block", width: "100%", maxHeight: "280px" }} />
                    ) : (
                      <img
                        src={entry.src} alt="preview"
                        style={{ display: "block", width: "100%", maxHeight: "280px", objectFit: "contain" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                  </div>
                )}
              </div>

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
                <TagPicker label="Characters" options={characters} selected={entry.characterIds} onChange={(ids) => patch({ characterIds: ids })} />
                <TagPicker label="Houses" options={houses} selected={entry.houseIds} onChange={(ids) => patch({ houseIds: ids })} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                <TagPicker label="Dragons" options={dragons} selected={entry.dragonIds} onChange={(ids) => patch({ dragonIds: ids })} />

                <SingleSelectPicker
                  label="Chapter (optional)"
                  options={chapters.map((c) => ({ id: c.slug, name: c.title }))}
                  selected={entry.chapterId ?? ""}
                  onChange={(v) => patch({ chapterId: v || null })}
                />
              </div>

              <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: hasDateOverride ? "16px" : "0" }}>
                  <div style={{ ...labelStyle, marginBottom: 0 }}>In-World Date</div>
                  <Checkbox checked={hasDateOverride} onChange={toggleDate} label={hasDateOverride ? "Enabled" : "Enable"} />
                </div>

                {hasDateOverride && entry.worldDate && (
                  <>
                    <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={labelStyle}>Day</div>
                        <input
                          type="number" min={1} max={30}
                          value={entry.worldDate.day}
                          onChange={(e) => patch({ worldDate: { ...entry.worldDate!, day: e.target.value === "" ? 0 : Number(e.target.value) } })}
                          onBlur={(e) => patch({ worldDate: { ...entry.worldDate!, day: Math.min(30, Math.max(1, Number(e.target.value) || 1)) } })}
                          style={{ width: "100%", height: "46px", boxSizing: "border-box" }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={labelStyle}>Moon</div>
                        <input
                          type="number" min={1} max={12}
                          value={entry.worldDate.moon}
                          onChange={(e) => patch({ worldDate: { ...entry.worldDate!, moon: e.target.value === "" ? 0 : Number(e.target.value) } })}
                          onBlur={(e) => patch({ worldDate: { ...entry.worldDate!, moon: Math.min(12, Math.max(1, Number(e.target.value) || 1)) } })}
                          style={{ width: "100%", height: "46px", boxSizing: "border-box" }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={labelStyle}>Year</div>
                        <input
                          type="number" min={1}
                          value={entry.worldDate.year}
                          onChange={(e) => patch({ worldDate: { ...entry.worldDate!, year: e.target.value === "" ? 0 : Number(e.target.value) } })}
                          onBlur={(e) => patch({ worldDate: { ...entry.worldDate!, year: Math.max(1, Number(e.target.value) || 1) } })}
                          style={{ width: "100%", height: "46px", boxSizing: "border-box" }}
                        />
                      </div>
                      <div className="era-select-wrap" style={{ flex: 1 }}>
                        <div style={labelStyle}>Era</div>
                        <Select
                          value={entry.worldDate.era}
                          options={eraOptions}
                          onChange={(v) => patch({ worldDate: { ...entry.worldDate!, era: v } })}
                        />
                        <style jsx>{`
                          .era-select-wrap :global(.te-select-trigger) {
                            height: 46px;
                            box-sizing: border-box;
                          }
                        `}</style>
                      </div>
                    </div>
                    <div style={{ color: "var(--gold)", fontSize: "0.9rem", fontStyle: "italic" }}>
                      ↳ {formatDate(entry.worldDate)}
                    </div>
                  </>
                )}
              </div>

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

      {showDeleteModal && (
        <ConfirmModal
          title="Delete Entry"
          message={`Remove "${entry?.caption || "this entry"}" from the gallery?\n\nThe file itself will not be deleted.`}
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

// ── Main Page — top-level Images / Videos tab bar, matching the Locations /
//    Character Positions switcher on admin/map/page.tsx. ───────────────────

export default function AdminRavensEyePage() {
  const [tab, setTab] = useState<MediaTab>("image");
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const draft = getDraft<GalleryEntry[]>("gallery");
    const loaded = draft ?? (galleryData as unknown as GalleryEntry[]);
    setEntries(loaded);
  }, []);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (entries.length === 0) return;
    setDraft("gallery", entries);
  }, [entries]);

  if (entries.length === 0) {
    return <div style={{ padding: "3rem 2rem", textAlign: "center", color: "var(--muted)" }}>Loading…</div>;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
        <button
          onClick={() => setTab("image")}
          style={{
            padding: "10px 18px", borderRadius: "6px", cursor: "pointer", border: "1px solid",
            background: tab === "image" ? "var(--gold)" : "transparent",
            color: tab === "image" ? "#000" : "var(--text)",
            borderColor: tab === "image" ? "var(--gold)" : "rgba(255,255,255,0.2)",
            fontWeight: tab === "image" ? "bold" : "normal",
          }}
        >
          Images
        </button>
        <button
          onClick={() => setTab("video")}
          style={{
            padding: "10px 18px", borderRadius: "6px", cursor: "pointer", border: "1px solid",
            background: tab === "video" ? "var(--gold)" : "transparent",
            color: tab === "video" ? "#000" : "var(--text)",
            borderColor: tab === "video" ? "var(--gold)" : "rgba(255,255,255,0.2)",
            fontWeight: tab === "video" ? "bold" : "normal",
          }}
        >
          Videos
        </button>
      </div>

      <GalleryMediaTab key={tab} mediaType={tab} entries={entries} setEntries={setEntries} />
    </div>
  );
}