// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\ravens-eye\page.tsx
"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  category?: "raven" | "fleabottom";
}

// ── Media type helper — derived from the src extension, never stored ───────

const VIDEO_EXT = [".mp4", ".webm", ".mov"];
function isVideo(src: string) {
  const lower = src.toLowerCase();
  return VIDEO_EXT.some((ext) => lower.endsWith(ext));
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
const ravenEntries = allEntries.filter((e) => e.category !== "fleabottom" && !isVideo(e.src));
const fleaEntries = allEntries.filter((e) => e.category === "fleabottom" && !isVideo(e.src));
const reelEntries = allEntries.filter((e) => isVideo(e.src));

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
    ...entry.characterIds.map((id) => ({ label: charMap[id] ?? id, type: "character" as const, id })),
    ...entry.houseIds.map((id) => ({ label: houseMap[id] ?? id, type: "house" as const, id })),
    ...entry.dragonIds.map((id) => ({ label: dragonMap[id] ?? id, type: "dragon" as const, id })),
  ];
}

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

// ── Tag button — clickable, applies a filter and scrolls back to the grid ──

function TagButton({
  tag,
  onClick,
  small = false,
}: {
  tag: { label: string; type: "character" | "house" | "dragon"; id: string };
  onClick: (type: "character" | "house" | "dragon", id: string) => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(tag.type, tag.id); }}
      className={styles.tagBtn}
    >
      <span className={small ? "te-pill te-pill-sm" : "te-pill"}>{tag.label}</span>
    </button>
  );
}

// ── Lightbox (images only) ──────────────────────────────────────────────────

function Lightbox({
  entry,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onTagClick,
}: {
  entry: GalleryEntry;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onTagClick: (type: "character" | "house" | "dragon", id: string) => void;
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
              <TagButton key={`${t.type}-${t.id}`} tag={t} onClick={(type, id) => { onClose(); onTagClick(type, id); }} />
            ))}
            {chapter && <span className="te-pill">{chapter}</span>}
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

// ── Reels viewer — TikTok/Reels style vertical scroll-snap, works on both
//    touch (mobile) and mouse-wheel/scrollbar (desktop) via native CSS
//    scroll-snap, no extra JS needed for the scrolling itself. An
//    IntersectionObserver just decides which <video> should be playing. ────

function ReelSlide({
  entry,
  onTagClick,
}: {
  entry: GalleryEntry;
  onTagClick: (type: "character" | "house" | "dragon", id: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const slide = slideRef.current;
    if (!video || !slide) return;

    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio > 0.6) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    observer.observe(slide);
    return () => observer.disconnect();
  }, []);

  const tags = tagsFor(entry);

  return (
    <div ref={slideRef} className={styles.reelSlide}>
      <video
        ref={videoRef}
        src={entry.src}
        className={styles.reelVideo}
        loop
        playsInline
        controls
        // Sound is on by default per spec — most mobile browsers will still
        // block un-muted autoplay until the user has interacted with the
        // page at least once; that's a browser policy, not something we
        // can override, but this stays un-muted so it plays with sound as
        // soon as the browser allows it.
      />

      {(entry.caption || tags.length > 0) && (
        <div className={styles.reelSlideMeta}>
          {entry.caption && <p className={styles.reelCaption}>{entry.caption}</p>}
          <div className={styles.reelTags}>
            {tags.map((t) => (
              <TagButton key={`${t.type}-${t.id}`} tag={t} onClick={onTagClick} small />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReelsViewer({
  entries,
  startIndex,
  onClose,
  onTagClick,
}: {
  entries: GalleryEntry[];
  startIndex: number;
  onClose: () => void;
  onTagClick: (type: "character" | "house" | "dragon", id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    // Jump straight to the tapped video without an animated scroll.
    const el = containerRef.current;
    if (el) {
      const slide = el.children[startIndex] as HTMLElement | undefined;
      slide?.scrollIntoView({ block: "start" });
    }
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.reelsViewer} ref={containerRef}>
      {entries.map((entry) => (
        <ReelSlide key={entry.id} entry={entry} onTagClick={(type, id) => { onClose(); onTagClick(type, id); }} />
      ))}
      <button onClick={onClose} className={styles.reelsCloseBtn} aria-label="Close">
        ✕
      </button>
    </div>
  );
}

// ── Tab bar ──────────────────────────────────────────────────────────────

type Tab = "raven" | "flea" | "reels";

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
  reels: {
    label: "Gutter Reels",
    entries: reelEntries,
    emptyLabel: "No reels yet — check back once someone in the gutters starts filming.",
    intro: (n) => `${n} ${n === 1 ? "clip" : "clips"} circulating the gutters.`,
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

// ── Image gallery section (Raven's Eye / Flea Bottom tabs) ─────────────────

function GallerySection({
  entries,
  emptyLabel,
  intro,
  onOpen,
  onTagClick,
}: {
  entries: GalleryEntry[];
  emptyLabel: string;
  intro: string;
  onOpen: (list: GalleryEntry[], idx: number) => void;
  onTagClick: (type: "character" | "house" | "dragon", id: string) => void;
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

  // Expose setters so tag clicks from the lightbox can drive these filters.
  useEffect(() => {
    (window as any).__ravensEyeSetFilter = (type: "character" | "house" | "dragon", id: string) => {
      if (type === "character") setFilterChar(id);
      if (type === "house") setFilterHouse(id);
      if (type === "dragon") setFilterDragon(id);
    };
  }, []);

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
                        <TagButton key={`${t.type}-${t.id}`} tag={t} onClick={onTagClick} small />
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

// ── Reels grid section (Gutter Reels tab) ───────────────────────────────────

function ReelsGridSection({
  entries,
  emptyLabel,
  intro,
  onOpen,
}: {
  entries: GalleryEntry[];
  emptyLabel: string;
  intro: string;
  onOpen: (idx: number) => void;
}) {
  return (
    <>
      <p className={styles.tabIntro}>{intro}</p>
      {entries.length === 0 ? (
        <div className={styles.emptyState}>{emptyLabel}</div>
      ) : (
        <div className={styles.reelsGrid}>
          {entries.map((entry, idx) => (
            <div key={entry.id} onClick={() => onOpen(idx)} className={styles.reelCard}>
              <video src={entry.src} className={styles.reelThumb} muted playsInline preload="metadata" />
              <div className={styles.reelPlayIcon}>▶</div>
            </div>
          ))}
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
  const [reelsStartIdx, setReelsStartIdx] = useState<number | null>(null);

  const openLightbox = useCallback((list: GalleryEntry[], idx: number) => {
    setLightboxList(list);
    setLightboxIdx(idx);
  }, []);
  const closeLightbox = useCallback(() => {
    setLightboxList(null);
    setLightboxIdx(null);
  }, []);

  // Tag click: switch to the raven tab (that's where char/house/dragon
  // filters live) and apply the filter once that section has mounted.
  const handleTagClick = useCallback((type: "character" | "house" | "dragon", id: string) => {
    setTab("raven");
    requestAnimationFrame(() => {
      (window as any).__ravensEyeSetFilter?.(type, id);
    });
  }, []);

  const activeMeta = TAB_META[tab];

  return (
    <div style={{ padding: "2rem 1.25rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div className={styles.header}>
        <h1 className={styles.title}>The Raven&apos;s Eye</h1>
        <p className={styles.subtitle}>Visions carried on black wings — and whatever else lands in the basket.</p>
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === "reels" ? (
        <ReelsGridSection
          entries={activeMeta.entries}
          emptyLabel={activeMeta.emptyLabel}
          intro={activeMeta.intro(activeMeta.entries.length)}
          onOpen={setReelsStartIdx}
        />
      ) : (
        <GallerySection
          key={tab}
          entries={activeMeta.entries}
          emptyLabel={activeMeta.emptyLabel}
          intro={activeMeta.intro(activeMeta.entries.length)}
          onOpen={openLightbox}
          onTagClick={handleTagClick}
        />
      )}

      {lightboxList && lightboxIdx !== null && (
        <Lightbox
          entry={lightboxList[lightboxIdx]}
          onClose={closeLightbox}
          onPrev={() => setLightboxIdx((i) => (i! > 0 ? i! - 1 : i))}
          onNext={() => setLightboxIdx((i) => (i! < lightboxList.length - 1 ? i! + 1 : i))}
          hasPrev={lightboxIdx > 0}
          hasNext={lightboxIdx < lightboxList.length - 1}
          onTagClick={handleTagClick}
        />
      )}

      {reelsStartIdx !== null && (
        <ReelsViewer
          entries={reelEntries}
          startIndex={reelsStartIdx}
          onClose={() => setReelsStartIdx(null)}
          onTagClick={handleTagClick}
        />
      )}
    </div>
  );
}