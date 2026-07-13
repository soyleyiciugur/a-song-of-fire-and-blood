// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\ravens-eye\page.tsx
"use client";

import { useState, useMemo, useEffect, useCallback, useRef, Suspense } from "react";
import galleryData from "@/data/gallery.json";
import charactersData from "@/data/characters/characters.json";
import housesData from "@/data/houses.json";
import dragonsData from "@/data/dragons.json";
import chaptersData from "@/data/chapters/chapters.json";
import { Select } from "../_components/Select";
import styles from "./ravens-eye.module.css";
import { useRouter, useSearchParams } from "next/navigation";

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

type TagType = "character" | "house" | "dragon" | "chapter";
type Tag = { label: string; type: TagType; id: string };

// ── Media type helper — derived from the src extension, never stored ───────

const VIDEO_EXT = [".mp4", ".webm", ".mov"];
function isVideo(src: string) {
  const lower = src.toLowerCase();
  return VIDEO_EXT.some((ext) => lower.endsWith(ext));
}

// A hack that gets iOS/desktop Safari (and most other browsers) to paint
// an actual frame instead of a black rectangle for a <video> that hasn't
// been played yet — without it, preview thumbnails in the reels grid were
// invisible until tapped.
function withPosterFrame(src: string) {
  return `${src}#t=0.1`;
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
// Grouped so we can render "Characters: A, B" / "Houses: C" as separate
// lines instead of one flat, mixed-up row of pills.
function groupedTagsFor(entry: GalleryEntry): Record<TagType, Tag[]> {
  const chapter = entry.chapterId ? chapterMap[entry.chapterId] : null;
  return {
    character: entry.characterIds.map((id) => ({ label: charMap[id] ?? id, type: "character", id })),
    house: entry.houseIds.map((id) => ({ label: houseMap[id] ?? id, type: "house", id })),
    dragon: entry.dragonIds.map((id) => ({ label: dragonMap[id] ?? id, type: "dragon", id })),
    chapter: chapter ? [{ label: chapter, type: "chapter", id: entry.chapterId! }] : [],
  };
}

function flatTagsFor(entry: GalleryEntry): Tag[] {
  const g = groupedTagsFor(entry);
  return [...g.character, ...g.house, ...g.dragon, ...g.chapter];
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

// Where a tag click should navigate to. Adjust these paths if your actual
// routes differ (dragons in particular — I haven't seen that route file).
function pathForTag(tag: Tag): string {
  switch (tag.type) {
    case "character": 
      return `/characters/${tag.id}`;
      
    case "house": 
      return `/houses/${tag.id}`;
      
    case "dragon": 
      return `/dragons/${tag.id}`;
      
    case "chapter": 
      return `/chapters/${tag.id}`;
  }
}

// ── Tag button — now navigates to the entity's own page instead of
//    filtering the gallery. ────────────────────────────────────────────────

function TagButton({ tag, small = false }: { tag: Tag; small?: boolean }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        router.push(pathForTag(tag));
      }}
      className={styles.tagBtn}
    >
      <span className={small ? "te-pill te-pill-sm" : "te-pill"}>{tag.label}</span>
    </button>
  );
}

// Renders tags grouped by category, each on its own row with a small
// kicker label — instead of one flat mixed row.
function GroupedTags({ entry, small = false }: { entry: GalleryEntry; small?: boolean }) {
  const g = groupedTagsFor(entry);
  const rows: { label: string; tags: Tag[] }[] = [
    { label: "Characters", tags: g.character },
    { label: "Houses", tags: g.house },
    { label: "Dragons", tags: g.dragon },
    { label: "Chapter", tags: g.chapter },
  ].filter((r) => r.tags.length > 0);

  if (rows.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {rows.map((row) => (
        <div 
          key={row.label} 
          className={styles.tagGroup} 
          style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}
        >
          <span className={styles.tagGroupLabel} style={{ opacity: 0.6, fontSize: "0.8rem", marginRight: "4px" }}>
            {row.label}:
          </span>
          {row.tags.map((t) => (
            <TagButton key={`${t.type}-${t.id}`} tag={t} small={small} />
          ))}
        </div>
      ))}
    </div>
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
            <GroupedTags entry={entry} />
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

// ── Reels viewer — TikTok/Reels style vertical scroll-snap. Native <video
//    controls> is gone entirely (that's what was drawing the persistent
//    10s-skip/scrub bar); play/pause is now a simple tap toggle with a
//    center icon that fades in and out, never blocking the frame. ─────────

function ReelSlide({ entry }: { entry: GalleryEntry }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const [showIcon, setShowIcon] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const iconTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const slide = slideRef.current;
    if (!video || !slide) return;

    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio > 0.6) {
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    observer.observe(slide);
    return () => observer.disconnect();
  }, []);

  const flashIcon = () => {
    setShowIcon(true);
    if (iconTimeout.current) clearTimeout(iconTimeout.current);
    iconTimeout.current = setTimeout(() => setShowIcon(false), 500);
  };

  const handleTap = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    flashIcon();
  };

  return (
    <div ref={slideRef} className={styles.reelSlide}>
      <video
        ref={videoRef}
        src={entry.src}
        className={styles.reelVideo}
        loop
        playsInline
        // Sound stays on by default — most mobile browsers still require
        // one prior user interaction with the page before an un-muted
        // video is allowed to autoplay; that's a browser policy, not
        // something to work around here.
      />

      {/* Invisible full-slide tap target — toggles play/pause, doesn't
          eat scroll-snap gestures since it's just a click/tap, not a
          drag handler. */}
      <div className={styles.reelTapCatcher} onClick={handleTap} />

      <div className={`${styles.reelCenterIcon} ${showIcon ? styles.reelCenterIconVisible : ""}`}>
        {isPlaying ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        )}
      </div>

      {(entry.caption || flatTagsFor(entry).length > 0) && (
        <div className={styles.reelSlideMeta}>
          {entry.caption && <p className={styles.reelCaption}>{entry.caption}</p>}
          <GroupedTags entry={entry} small />
        </div>
      )}
    </div>
  );
}

function ReelsViewer({
  entries,
  startIndex,
  onClose,
}: {
  entries: GalleryEntry[];
  startIndex: number;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
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
        <ReelSlide key={entry.id} entry={entry} />
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
            const tags = flatTagsFor(entry);
            return (
              <div key={entry.id} onClick={() => onOpen(filtered, idx)} className={styles.card}>
                <img src={entry.src} alt={entry.caption || "Gallery image"} loading="lazy" className={styles.cardImg} />
                {(entry.caption || tags.length > 0) && (
                  <div className={styles.cardOverlay}>
                    {entry.caption && <p className={styles.cardCaption}>{entry.caption}</p>}
                    <div className={styles.cardTags}>
                      {tags.slice(0, 3).map((t) => (
                        <TagButton key={`${t.type}-${t.id}`} tag={t} small />
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

// ── Reels grid section (Gutter Reels tab) — now with the same filter/sort
//    controls as the image tabs, and thumbnails that actually render a
//    frame instead of a blank/black box. ───────────────────────────────────

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
        <div className={styles.emptyState}>{entries.length === 0 ? emptyLabel : "No clips match the current filters."}</div>
      ) : (
        <div className={styles.reelsGrid}>
          {filtered.map((entry, idx) => (
            <div key={entry.id} onClick={() => onOpen(idx)} className={styles.reelCard}>
              <video
                src={withPosterFrame(entry.src)}
                className={styles.reelThumb}
                muted
                playsInline
                preload="metadata"
              />
              <div className={styles.reelPlayIcon}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

  function RavensEyePageInner() {
  const [tab, setTab] = useState<Tab>("raven");
  const [lightboxList, setLightboxList] = useState<GalleryEntry[] | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [reelsStartIdx, setReelsStartIdx] = useState<number | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const itemId = searchParams.get("item");
    if (!itemId) return;
    const idx = ravenEntries.findIndex((e) => e.id === itemId);
    if (idx !== -1) {
      setTab("raven");
      setLightboxList(ravenEntries);
      setLightboxIdx(idx);
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        />
      )}

      {reelsStartIdx !== null && (
        <ReelsViewer
          entries={reelEntries}
          startIndex={reelsStartIdx}
          onClose={() => setReelsStartIdx(null)}
        />
      )}
    </div>
  );
}

export default function RavensEyePage() {
  return (
    <Suspense fallback={null}>
      <RavensEyePageInner />
    </Suspense>
  );
}