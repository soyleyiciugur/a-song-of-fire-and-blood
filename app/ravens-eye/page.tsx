// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\ravens-eye\page.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import galleryData from "@/data/gallery.json";
import charactersData from "@/data/characters/characters.json";
import housesData from "@/data/houses.json";
import dragonsData from "@/data/dragons.json";
import chaptersData from "@/data/chapters/chapters.json";
import { Select } from "../_components/Select";
import styles from "./ravens-eye.module.css";

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
  // Optional — entries without this (or with "raven") stay in the main
  // archive. Set to "fleabottom" in gallery.json to move an image into the
  // meme corner instead. Nothing breaks for old entries that don't have it.
  category?: "raven" | "fleabottom";
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatDate(d: WorldDate) {
  return `${ordinal(d.day)} of the ${d.moon}th Moon, ${d.year} ${d.era}`;
}

function dateToSortKey(d: WorldDate | null): number {
  if (!d) return Infinity;
  const sign = d.era === "BC" ? -1 : 1;
  return sign * (d.year * 10000 + d.moon * 100 + d.day);
}

// ── Data ───────────────────────────────────────────────────────────────────

const allEntries = galleryData as unknown as GalleryEntry[];
const ravenEntries = allEntries.filter((e) => e.category !== "fleabottom");
const fleaEntries = allEntries.filter((e) => e.category === "fleabottom");

const charMap = Object.fromEntries(
  (charactersData as { id: string; name: string }[]).map((c) => [c.id, c.name])
);
const houseMap = Object.fromEntries(
  (housesData as { id: string; name: string }[]).map((h) => [h.id, h.name])
);
const dragonMap = Object.fromEntries(
  (dragonsData as { id: string; name: string }[]).map((d) => [d.id, d.name])
);
const chapterMap = Object.fromEntries(
  (chaptersData as { slug: string; title: string }[]).map((c) => [c.slug, c.title])
);

type SortKey = "uploadedAt" | "worldDate-asc" | "worldDate-desc";

const SORT_OPTIONS = [
  { id: "uploadedAt", name: "Latest added" },
  { id: "worldDate-asc", name: "Date: oldest first" },
  { id: "worldDate-desc", name: "Date: newest first" },
];

function tagsFor(entry: GalleryEntry) {
  return [
    ...entry.characterIds.map((id) => charMap[id] ?? id),
    ...entry.houseIds.map((id) => `${houseMap[id] ?? id}`),
    ...entry.dragonIds.map((id) => dragonMap[id] ?? id),
  ];
}

// Builds the character/house/dragon filter option lists scoped to whatever
// pool of entries is currently active (Raven's Eye or Flea Bottom) — so the
// dropdowns never offer a filter that would return zero results.
function filterOptionsFor(entries: GalleryEntry[]) {
  const characters = (charactersData as { id: string; name: string }[]).filter((c) =>
    entries.some((e) => e.characterIds.includes(c.id))
  );
  const houses = (housesData as { id: string; name: string }[]).filter((h) =>
    entries.some((e) => e.houseIds.includes(h.id))
  );
  const dragons = (dragonsData as { id: string; name: string }[]).filter((d) =>
    entries.some((e) => e.dragonIds.includes(d.id))
  );
  return { characters, houses, dragons };
}

// ── Lightbox ───────────────────────────────────────────────────────────────

function Lightbox({
  entry,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  entry: GalleryEntry;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  const tags = tagsFor(entry);
  const chapter = entry.chapterId ? chapterMap[entry.chapterId] : null;

  return (
    <div onClick={onClose} className={styles.lightboxBackdrop}>
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className={`${styles.navBtn} ${styles.navLeft}`}
          aria-label="Previous"
        >
          ‹
        </button>
      )}

      <div onClick={(e) => e.stopPropagation()} className={styles.lightboxCard}>
        <div className={styles.lightboxImgWrap}>
          <img src={entry.src} alt={entry.caption || "Gallery image"} className={styles.lightboxImg} />
        </div>

        <div className={styles.lightboxMeta}>
          {entry.caption && <p className={styles.lightboxCaption}>{entry.caption}</p>}
          <div className={styles.lightboxTags}>
            {tags.map((t) => (
              <span key={t} className="te-pill">{t}</span>
            ))}
            {chapter && <span className="te-pill">{`Ch: ${chapter}`}</span>}
          </div>
          {entry.worldDate && <div className={styles.lightboxDate}>{formatDate(entry.worldDate)}</div>}
        </div>
      </div>

      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className={`${styles.navBtn} ${styles.navRight}`}
          aria-label="Next"
        >
          ›
        </button>
      )}

      <button onClick={onClose} className={styles.closeBtn} aria-label="Close">
        ✕
      </button>
    </div>
  );
}

// ── Tab bar ──────────────────────────────────────────────────────────────

type Tab = "raven" | "flea";

const TAB_META: Record<Tab, { label: string; entries: GalleryEntry[]; emptyLabel: string; intro: (count: number) => string }> = {
  raven: {
    label: "The Raven's Eye",
    entries: ravenEntries,
    emptyLabel: "The archive is empty for now.",
    intro: (n) => `${n} ${n === 1 ? "image" : "images"} in the archive.`,
  },
  flea: {
    label: "Memes from the Gutters of Flea Bottom",
    entries: fleaEntries,
    emptyLabel: "Nothing here yet — check back once someone in Flea Bottom gets creative.",
    intro: () => "Whatever the smallfolk are passing around this week. Take it with a pinch of salt (and maybe a bath after).",
  },
};

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className={styles.tabBar}>
      {(Object.keys(TAB_META) as Tab[]).map((id) => {
        const meta = TAB_META[id];
        const count = meta.entries.length;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`${styles.tabBtn} ${active === id ? styles.tabBtnActive : ""}`}
          >
            {meta.label}
            {count > 0 ? ` (${count})` : ""}
          </button>
        );
      })}
    </div>
  );
}

// ── One gallery section — identical behavior for both tabs: filters, sort,
//    tags, masonry grid. The only thing that differs between "raven" and
//    "flea" is which entries it's fed. ─────────────────────────────────────

function GallerySection({
  entries,
  emptyLabel,
  intro,
  onOpen,
}: {
  entries: GalleryEntry[];
  emptyLabel: string;
  intro: string;
  onOpen: (list: GalleryEntry[], idx: number) => void;
}) {
  const [filterChar, setFilterChar] = useState<string>("");
  const [filterHouse, setFilterHouse] = useState<string>("");
  const [filterDragon, setFilterDragon] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("uploadedAt");

  const { characters, houses, dragons } = useMemo(() => filterOptionsFor(entries), [entries]);

  const filtered = useMemo(() => {
    let result = [...entries];
    if (filterChar) result = result.filter((e) => e.characterIds.includes(filterChar));
    if (filterHouse) result = result.filter((e) => e.houseIds.includes(filterHouse));
    if (filterDragon) result = result.filter((e) => e.dragonIds.includes(filterDragon));

    if (sort === "uploadedAt") {
      result.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    } else if (sort === "worldDate-asc") {
      result.sort((a, b) => dateToSortKey(a.worldDate) - dateToSortKey(b.worldDate));
    } else {
      result.sort((a, b) => dateToSortKey(b.worldDate) - dateToSortKey(a.worldDate));
    }
    return result;
  }, [entries, filterChar, filterHouse, filterDragon, sort]);

  const anyFilter = filterChar || filterHouse || filterDragon;

  const charOptions = [{ id: "", name: "All characters" }, ...characters];
  const houseOptions = [{ id: "", name: "All houses" }, ...houses.map((h) => ({ id: h.id, name: `${h.name}` }))];
  const dragonOptions = [{ id: "", name: "All dragons" }, ...dragons];

  return (
    <>
      <p className={styles.tabIntro}>{intro}</p>

      <div className={styles.filterBar}>
        {characters.length > 0 && (
          <Select value={filterChar} options={charOptions} onChange={setFilterChar} searchable />
        )}
        {houses.length > 0 && (
          <Select value={filterHouse} options={houseOptions} onChange={setFilterHouse} searchable />
        )}
        {dragons.length > 0 && (
          <Select value={filterDragon} options={dragonOptions} onChange={setFilterDragon} searchable />
        )}

        <div className={styles.filterRight}>
          {anyFilter && (
            <button
              onClick={() => { setFilterChar(""); setFilterHouse(""); setFilterDragon(""); }}
              className={styles.clearBtn}
            >
              Clear filters
            </button>
          )}
          <Select value={sort} options={SORT_OPTIONS} onChange={(v) => setSort(v as SortKey)} />
        </div>
      </div>

      {anyFilter && (
        <div className={styles.resultCount}>
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>{entries.length === 0 ? emptyLabel : "No images match the current filters."}</div>
      ) : (
        <div className={styles.masonry}>
          {filtered.map((entry, idx) => {
            const tags = tagsFor(entry);
            return (
              <div key={entry.id} onClick={() => onOpen(filtered, idx)} className={styles.card}>
                <img src={entry.src} alt={entry.caption || "Gallery image"} loading="lazy" className={styles.cardImg} />
                {(entry.caption || tags.length > 0) && (
                  <div className={styles.cardOverlay}>
                    {entry.caption && <p className={styles.cardCaption}>{entry.caption}</p>}
                    <div className={styles.cardTags}>
                      {tags.slice(0, 3).map((t) => (
                        <span key={t} className="te-pill te-pill-sm">{t}</span>
                      ))}
                      {tags.length > 3 && <span className="te-pill te-pill-sm">{`+${tags.length - 3}`}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function RavensEyePage() {
  const [tab, setTab] = useState<Tab>("raven");
  const [lightboxList, setLightboxList] = useState<GalleryEntry[] | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const openLightbox = useCallback((list: GalleryEntry[], idx: number) => {
    setLightboxList(list);
    setLightboxIdx(idx);
  }, []);
  const closeLightbox = useCallback(() => {
    setLightboxList(null);
    setLightboxIdx(null);
  }, []);

  const activeMeta = TAB_META[tab];

  return (
    <div style={{ padding: "2rem 1.25rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Hub header — stays put, doesn't change per tab. */}
      <div className={styles.header}>
        <h1 className={styles.title}>The Raven&apos;s Eye</h1>
        <p className={styles.subtitle}>Visions carried on black wings — and whatever else lands in the basket.</p>
      </div>

      {/* Tabs — always both present, regardless of how many entries either
          side has. This is a hub, not a page that hides half of itself. */}
      <TabBar active={tab} onChange={setTab} />

      {/* Same component, same filters/sort/tags for both tabs — just fed a
          different slice of the data. Key forces filter/sort state to reset
          when switching tabs instead of leaking between the two pools. */}
      <GallerySection
        key={tab}
        entries={activeMeta.entries}
        emptyLabel={activeMeta.emptyLabel}
        intro={activeMeta.intro(activeMeta.entries.length)}
        onOpen={openLightbox}
      />

      {/* Lightbox — shared between both tabs, scoped to whichever list was
          clicked so prev/next doesn't jump between them. */}
      {lightboxList && lightboxIdx !== null && (
        <Lightbox
          entry={lightboxList[lightboxIdx]}
          onClose={closeLightbox}
          onPrev={() => setLightboxIdx((i) => (i! > 0 ? i! - 1 : i))}
          onNext={() => setLightboxIdx((i) => (i! < lightboxList.length - 1 ? i! + 1 : i))}
          hasPrev={lightboxIdx > 0}
          hasNext={lightboxIdx < lightboxList.length - 1}
        />
      )}
    </div>
  );
}