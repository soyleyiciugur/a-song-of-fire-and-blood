// app/ravens-eye/_RavensEyePage.tsx
"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import galleryData from "@/data/gallery.json";
import charactersData from "@/data/characters/characters.json";
import housesData from "@/data/houses.json";
import dragonsData from "@/data/dragons.json";
import chaptersData from "@/data/chapters.json";
import { Select } from "../_components/Select";
import styles from "./ravens-eye.module.css";

// ── Types ──────────────────────────────────────────────────────────────────

interface WorldDate {
  day: number;
  moon: number;
  year: number;
  era: string;
}

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
type SortKey = "uploadedAt" | "worldDate-asc" | "worldDate-desc";
export type RavensEyeTab = "raven" | "flea" | "reels";

// ── Media helpers ──────────────────────────────────────────────────────────

const VIDEO_EXT = [".mp4", ".webm", ".mov"];

function isVideo(src: string) {
  const clean = src.split("?")[0].split("#")[0].toLowerCase();
  return VIDEO_EXT.some((ext) => clean.endsWith(ext));
}

function withPosterFrame(src: string) {
  return `${src}#t=0.1`;
}

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

const ravenEntries = allEntries.filter(
  (e) => e.category !== "fleabottom" && !isVideo(e.src)
);
const fleaEntries = allEntries.filter(
  (e) => e.category === "fleabottom" && !isVideo(e.src)
);
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
  (chaptersData as { slug: string; title: string }[]).map((c) => [
    c.slug,
    c.title,
  ])
);

const SORT_OPTIONS = [
  { id: "uploadedAt", name: "Latest added" },
  { id: "worldDate-asc", name: "Date: oldest first" },
  { id: "worldDate-desc", name: "Date: newest first" },
];

const TAB_META: Record<
  RavensEyeTab,
  {
    label: string;
    href: string;
    entries: GalleryEntry[];
    emptyLabel: string;
    intro: (count: number) => string;
  }
> = {
  raven: {
    label: "The Raven's Eye",
    href: "/ravens-eye",
    entries: ravenEntries,
    emptyLabel: "The archive is empty for now.",
    intro: (n) => `${n} ${n === 1 ? "image" : "images"} in the archive.`,
  },
  flea: {
    label: "Memes from the Gutters of Flea Bottom",
    href: "/ravens-eye/memes",
    entries: fleaEntries,
    emptyLabel:
      "Nothing here yet — check back once someone in Flea Bottom gets creative.",
    intro: () =>
      "Whatever the smallfolk are passing around this week. Take it with a pinch of salt (and maybe a bath after).",
  },
  reels: {
    label: "Gutter Reels",
    href: "/ravens-eye/reels",
    entries: reelEntries,
    emptyLabel:
      "No reels yet — check back once someone in the gutters starts filming.",
    intro: (n) => `${n} ${n === 1 ? "clip" : "clips"} circulating the gutters.`,
  },
};

// ── Tags ───────────────────────────────────────────────────────────────────

function groupedTagsFor(entry: GalleryEntry): Record<TagType, Tag[]> {
  const chapter = entry.chapterId ? chapterMap[entry.chapterId] : null;

  return {
    character: entry.characterIds.map((id) => ({
      label: charMap[id] ?? id,
      type: "character",
      id,
    })),
    house: entry.houseIds.map((id) => ({
      label: houseMap[id] ?? id,
      type: "house",
      id,
    })),
    dragon: entry.dragonIds.map((id) => ({
      label: dragonMap[id] ?? id,
      type: "dragon",
      id,
    })),
    chapter: chapter
      ? [{ label: chapter, type: "chapter", id: entry.chapterId! }]
      : [],
  };
}

function flatTagsFor(entry: GalleryEntry): Tag[] {
  const g = groupedTagsFor(entry);
  return [...g.character, ...g.house, ...g.dragon, ...g.chapter];
}

function filterOptionsFor(entries: GalleryEntry[]) {
  const characters = (
    charactersData as { id: string; name: string }[]
  ).filter((c) => entries.some((e) => e.characterIds.includes(c.id)));

  const houses = (housesData as { id: string; name: string }[]).filter((h) =>
    entries.some((e) => e.houseIds.includes(h.id))
  );

  const dragons = (dragonsData as { id: string; name: string }[]).filter((d) =>
    entries.some((e) => e.dragonIds.includes(d.id))
  );

  return { characters, houses, dragons };
}

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
      <span className={small ? "te-pill te-pill-sm" : "te-pill"}>
        {tag.label}
      </span>
    </button>
  );
}

function GroupedTags({
  entry,
  small = false,
}: {
  entry: GalleryEntry;
  small?: boolean;
}) {
  const g = groupedTagsFor(entry);

  const rows: { label: string; tags: Tag[] }[] = [
    { label: "Characters", tags: g.character },
    { label: "Houses", tags: g.house },
    { label: "Dragons", tags: g.dragon },
    { label: "Chapter", tags: g.chapter },
  ].filter((r) => r.tags.length > 0);

  if (rows.length === 0) return null;

  return (
    <div className={styles.tagGroups}>
      {rows.map((row) => (
        <div key={row.label} className={styles.tagGroup}>
          <span className={styles.tagGroupLabel}>{row.label}:</span>
          {row.tags.map((t) => (
            <TagButton key={`${t.type}-${t.id}`} tag={t} small={small} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Instagram-style expandable captions ────────────────────────────────────

function ExpandableCaption({
  text,
  className,
  limit = 180,
  scrollWhenExpanded = false,
}: {
  text: string;
  className?: string;
  limit?: number;
  scrollWhenExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const needsMore = text.length > limit;

  useEffect(() => {
    if (!expanded && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [expanded]);

  const visible =
    needsMore && !expanded
      ? `${text.slice(0, limit).trimEnd()}…`
      : text;

  if (!needsMore) {
    return <p className={className}>{text}</p>;
  }

  if (!expanded) {
    return (
      <p className={className}>
        {visible}{" "}
        <button
          type="button"
          className={styles.captionMoreBtn}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
        >
          more
        </button>
      </p>
    );
  }

  if (scrollWhenExpanded) {
    return (
      <div
        className={styles.expandedCaptionShell}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div
          ref={scrollRef}
          className={`${className ?? ""} ${styles.expandedCaptionScroll}`}
        >
          {text}
        </div>

        <div className={styles.captionCollapseRow}>
          <button
            type="button"
            className={styles.captionMoreBtn}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
            }}
          >
            less
          </button>
        </div>
      </div>
    );
  }

  return (
    <p className={className}>
      {text}{" "}
      <button
        type="button"
        className={styles.captionMoreBtn}
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(false);
        }}
      >
        less
      </button>
    </p>
  );
}

// ── URL helpers ─────────────────────────────────────────────────────────────

function mediaUrl(tab: RavensEyeTab, id?: string) {
  const base = TAB_META[tab].href;
  return id ? `${base}?item=${encodeURIComponent(id)}` : base;
}

function setBrowserUrl(url: string, mode: "push" | "replace" = "push") {
  if (typeof window === "undefined") return;

  if (mode === "replace") {
    window.history.replaceState(window.history.state, "", url);
  } else {
    window.history.pushState(window.history.state, "", url);
  }
}

// ── Lightbox ────────────────────────────────────────────────────────────────

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
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className={`${styles.navBtn} ${styles.navLeft}`}
          aria-label="Previous"
        >
          ‹
        </button>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className={styles.lightboxCard}
      >
        <div className={styles.lightboxImgWrap}>
          <img
            src={entry.src}
            alt={entry.caption || "Gallery image"}
            className={styles.lightboxImg}
          />
        </div>

        <div className={styles.lightboxMeta}>
          {entry.caption && (
            <ExpandableCaption
              text={entry.caption}
              className={styles.lightboxCaption}
              limit={220}
            />
          )}

          <div className={styles.lightboxTags}>
            <GroupedTags entry={entry} />
          </div>

          {entry.worldDate && (
            <div className={styles.lightboxDate}>
              {formatDate(entry.worldDate)}
            </div>
          )}
        </div>
      </div>

      {hasNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className={`${styles.navBtn} ${styles.navRight}`}
          aria-label="Next"
        >
          ›
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        className={styles.closeBtn}
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}

// ── Reel progress / seek bar ────────────────────────────────────────────────

function ReelProgress({
  videoRef,
  progress,
  onSeek,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  progress: number;
  onSeek: (progress: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      const video = videoRef.current;
      if (!track || !video || !Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      const rect = track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      video.currentTime = ratio * video.duration;
      onSeek(ratio);
    },
    [videoRef, onSeek]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    seekFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    e.stopPropagation();
    seekFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      ref={trackRef}
      className={styles.reelProgressHitbox}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
      role="slider"
      aria-label="Video progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      tabIndex={0}
      onKeyDown={(e) => {
        const video = videoRef.current;
        if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          e.stopPropagation();
          const delta = e.key === "ArrowLeft" ? -5 : 5;
          const next = Math.min(
            video.duration,
            Math.max(0, video.currentTime + delta)
          );
          video.currentTime = next;
          onSeek(next / video.duration);
        }
      }}
    >
      <div className={styles.reelProgressTrack}>
        <div
          className={styles.reelProgressFill}
          style={{ transform: `scaleX(${progress})` }}
        />
        <div
          className={styles.reelProgressThumb}
          style={{ left: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Reels viewer ────────────────────────────────────────────────────────────

function ReelSlide({
  entry,
  onActive,
}: {
  entry: GalleryEntry;
  onActive: (entry: GalleryEntry) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const iconTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showIcon, setShowIcon] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    const slide = slideRef.current;
    if (!video || !slide) return;

    const observer = new IntersectionObserver(
      ([intersection]) => {
        if (
          intersection.isIntersecting &&
          intersection.intersectionRatio > 0.6
        ) {
          onActive(entry);
          video
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: [0, 0.6, 1] }
    );

    observer.observe(slide);
    return () => observer.disconnect();
  }, [entry, onActive]);

  useEffect(() => {
    return () => {
      if (iconTimeout.current) clearTimeout(iconTimeout.current);
    };
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
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }

    flashIcon();
  };

  const updateProgress = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      setProgress(0);
      return;
    }
    setProgress(video.currentTime / video.duration);
  };

  return (
    <div ref={slideRef} className={styles.reelSlide}>
      <video
        ref={videoRef}
        src={entry.src}
        className={styles.reelVideo}
        loop
        playsInline
        preload="metadata"
        onTimeUpdate={updateProgress}
        onLoadedMetadata={updateProgress}
        onDurationChange={updateProgress}
      />

      <div className={styles.reelTapCatcher} onClick={handleTap} />

      <div
        className={`${styles.reelCenterIcon} ${
          showIcon ? styles.reelCenterIconVisible : ""
        }`}
      >
        {isPlaying ? (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <rect x="6" y="5" width="4" height="14" />
            <rect x="14" y="5" width="4" height="14" />
          </svg>
        ) : (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </div>

      {(entry.caption || flatTagsFor(entry).length > 0) && (
        <div className={styles.reelSlideMeta}>
          {entry.caption && (
            <ExpandableCaption
              text={entry.caption}
              className={styles.reelCaption}
              limit={165}
              scrollWhenExpanded
            />
          )}
          <GroupedTags entry={entry} small />
        </div>
      )}

      <ReelProgress
        videoRef={videoRef}
        progress={progress}
        onSeek={setProgress}
      />
    </div>
  );
}

function ReelsViewer({
  entries,
  startIndex,
  onClose,
  onActiveEntry,
}: {
  entries: GalleryEntry[];
  startIndex: number;
  onClose: () => void;
  onActiveEntry: (entry: GalleryEntry) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const frame = requestAnimationFrame(() => {
      const el = containerRef.current;
      if (!el) return;
      const slide = el.children[startIndex] as HTMLElement | undefined;
      slide?.scrollIntoView({ block: "start" });
    });

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handler);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
    };
  }, [onClose, startIndex]);

  return (
    <div className={styles.reelsViewer} ref={containerRef}>
      {entries.map((entry) => (
        <ReelSlide
          key={entry.id}
          entry={entry}
          onActive={onActiveEntry}
        />
      ))}

      <button
        type="button"
        onClick={onClose}
        className={styles.reelsCloseBtn}
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}

// ── Tab bar ────────────────────────────────────────────────────────────────

function TabBar({ active }: { active: RavensEyeTab }) {
  return (
    <nav className={styles.tabBar} aria-label="Raven's Eye sections">
      {(Object.keys(TAB_META) as RavensEyeTab[]).map((id) => {
        const meta = TAB_META[id];
        const count = meta.entries.length;

        return (
          <a
            key={id}
            href={meta.href}
            className={`${styles.tabBtn} ${
              active === id ? styles.tabBtnActive : ""
            }`}
            aria-current={active === id ? "page" : undefined}
          >
            {meta.label}
            {count > 0 ? ` (${count})` : ""}
          </a>
        );
      })}
    </nav>
  );
}

// ── Shared filters ──────────────────────────────────────────────────────────

function useGalleryFilters(entries: GalleryEntry[]) {
  const [filterChar, setFilterChar] = useState("");
  const [filterHouse, setFilterHouse] = useState("");
  const [filterDragon, setFilterDragon] = useState("");
  const [sort, setSort] = useState<SortKey>("uploadedAt");

  const { characters, houses, dragons } = useMemo(
    () => filterOptionsFor(entries),
    [entries]
  );

  const filtered = useMemo(() => {
    let result = [...entries];

    if (filterChar) {
      result = result.filter((e) => e.characterIds.includes(filterChar));
    }
    if (filterHouse) {
      result = result.filter((e) => e.houseIds.includes(filterHouse));
    }
    if (filterDragon) {
      result = result.filter((e) => e.dragonIds.includes(filterDragon));
    }

    if (sort === "uploadedAt") {
      result.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    } else if (sort === "worldDate-asc") {
      result.sort(
        (a, b) => dateToSortKey(a.worldDate) - dateToSortKey(b.worldDate)
      );
    } else {
      result.sort(
        (a, b) => dateToSortKey(b.worldDate) - dateToSortKey(a.worldDate)
      );
    }

    return result;
  }, [entries, filterChar, filterHouse, filterDragon, sort]);

  return {
    filterChar,
    setFilterChar,
    filterHouse,
    setFilterHouse,
    filterDragon,
    setFilterDragon,
    sort,
    setSort,
    characters,
    houses,
    dragons,
    filtered,
    anyFilter: Boolean(filterChar || filterHouse || filterDragon),
  };
}

function FilterBar({
  filters,
}: {
  filters: ReturnType<typeof useGalleryFilters>;
}) {
  const {
    filterChar,
    setFilterChar,
    filterHouse,
    setFilterHouse,
    filterDragon,
    setFilterDragon,
    sort,
    setSort,
    characters,
    houses,
    dragons,
    anyFilter,
  } = filters;

  const charOptions = [{ id: "", name: "All characters" }, ...characters];
  const houseOptions = [
    { id: "", name: "All houses" },
    ...houses.map((h) => ({ id: h.id, name: h.name })),
  ];
  const dragonOptions = [{ id: "", name: "All dragons" }, ...dragons];

  return (
    <div className={styles.filterBar}>
      {characters.length > 0 && (
        <Select
          value={filterChar}
          options={charOptions}
          onChange={setFilterChar}
          searchable
        />
      )}

      {houses.length > 0 && (
        <Select
          value={filterHouse}
          options={houseOptions}
          onChange={setFilterHouse}
          searchable
        />
      )}

      {dragons.length > 0 && (
        <Select
          value={filterDragon}
          options={dragonOptions}
          onChange={setFilterDragon}
          searchable
        />
      )}

      <div className={styles.filterRight}>
        {anyFilter && (
          <button
            type="button"
            onClick={() => {
              setFilterChar("");
              setFilterHouse("");
              setFilterDragon("");
            }}
            className={styles.clearBtn}
          >
            Clear filters
          </button>
        )}

        <Select
          value={sort}
          options={SORT_OPTIONS}
          onChange={(v) => setSort(v as SortKey)}
        />
      </div>
    </div>
  );
}

// ── Image gallery ───────────────────────────────────────────────────────────

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
  const filters = useGalleryFilters(entries);
  const { filtered, anyFilter } = filters;

  return (
    <>
      <p className={styles.tabIntro}>{intro}</p>

      <FilterBar filters={filters} />

      {anyFilter && (
        <div className={styles.resultCount}>
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          {entries.length === 0
            ? emptyLabel
            : "No images match the current filters."}
        </div>
      ) : (
        <div className={styles.masonry}>
          {filtered.map((entry, idx) => {
            const tags = flatTagsFor(entry);

            return (
              <div
                key={entry.id}
                onClick={() => onOpen(filtered, idx)}
                className={styles.card}
              >
                <img
                  src={entry.src}
                  alt={entry.caption || "Gallery image"}
                  loading="lazy"
                  className={styles.cardImg}
                />

                {(entry.caption || tags.length > 0) && (
                  <div className={styles.cardOverlay}>
                    {entry.caption && (
                      <p className={styles.cardCaption}>{entry.caption}</p>
                    )}

                    <div className={styles.cardTags}>
                      {tags.slice(0, 3).map((t) => (
                        <TagButton
                          key={`${t.type}-${t.id}`}
                          tag={t}
                          small
                        />
                      ))}
                      {tags.length > 3 && (
                        <span className="te-pill te-pill-sm">
                          {`+${tags.length - 3}`}
                        </span>
                      )}
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

// ── Reels grid ──────────────────────────────────────────────────────────────

function ReelsGridSection({
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
  const filters = useGalleryFilters(entries);
  const { filtered, anyFilter } = filters;

  return (
    <>
      <p className={styles.tabIntro}>{intro}</p>

      <FilterBar filters={filters} />

      {anyFilter && (
        <div className={styles.resultCount}>
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          {entries.length === 0
            ? emptyLabel
            : "No clips match the current filters."}
        </div>
      ) : (
        <div className={styles.reelsGrid}>
          {filtered.map((entry, idx) => (
            <div
              key={entry.id}
              onClick={() => onOpen(filtered, idx)}
              className={styles.reelCard}
            >
              <video
                src={withPosterFrame(entry.src)}
                className={styles.reelThumb}
                muted
                playsInline
                preload="metadata"
              />

              <div className={styles.reelPlayIcon}>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

function RavensEyePageInner({
  forcedTab,
}: {
  forcedTab?: RavensEyeTab;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab: RavensEyeTab = forcedTab ?? "raven";

  const [lightboxList, setLightboxList] = useState<GalleryEntry[] | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const [reelsList, setReelsList] = useState<GalleryEntry[] | null>(null);
  const [reelsStartIdx, setReelsStartIdx] = useState<number | null>(null);

  const activeMeta = TAB_META[tab];

  // Direct-link support:
  // /ravens-eye?item=...
  // /ravens-eye/memes?item=...
  // /ravens-eye/reels?item=...
  useEffect(() => {
    const itemId = searchParams.get("item");

    if (!itemId) {
      setLightboxList(null);
      setLightboxIdx(null);
      setReelsList(null);
      setReelsStartIdx(null);
      return;
    }

    const idx = activeMeta.entries.findIndex((e) => e.id === itemId);

    if (idx === -1) {
      // The item exists, but the supplied section URL is wrong.
      // Send it to the correct Raven's Eye section.
      const globalEntry = allEntries.find((e) => e.id === itemId);

      if (globalEntry) {
        const correctTab: RavensEyeTab = isVideo(globalEntry.src)
          ? "reels"
          : globalEntry.category === "fleabottom"
            ? "flea"
            : "raven";

        router.replace(mediaUrl(correctTab, globalEntry.id));
      }

      return;
    }

    if (tab === "reels") {
      setReelsList(activeMeta.entries);
      setReelsStartIdx(idx);
      setLightboxList(null);
      setLightboxIdx(null);
    } else {
      setLightboxList(activeMeta.entries);
      setLightboxIdx(idx);
      setReelsList(null);
      setReelsStartIdx(null);
    }
  }, [activeMeta.entries, router, searchParams, tab]);

  const openLightbox = useCallback(
    (list: GalleryEntry[], idx: number) => {
      setLightboxList(list);
      setLightboxIdx(idx);
      setBrowserUrl(mediaUrl(tab, list[idx].id));
    },
    [tab]
  );

  const closeLightbox = useCallback(() => {
    setLightboxList(null);
    setLightboxIdx(null);
    setBrowserUrl(mediaUrl(tab));
  }, [tab]);

  const moveLightbox = useCallback(
    (direction: -1 | 1) => {
      setLightboxIdx((current) => {
        if (current === null || !lightboxList) return current;
        const next = current + direction;

        if (next < 0 || next >= lightboxList.length) return current;

        setBrowserUrl(mediaUrl(tab, lightboxList[next].id), "replace");
        return next;
      });
    },
    [lightboxList, tab]
  );

  const openReels = useCallback(
    (list: GalleryEntry[], idx: number) => {
      setReelsList(list);
      setReelsStartIdx(idx);
      setBrowserUrl(mediaUrl("reels", list[idx].id));
    },
    []
  );

  const closeReels = useCallback(() => {
    setReelsList(null);
    setReelsStartIdx(null);
    setBrowserUrl(mediaUrl("reels"));
  }, []);

  const handleActiveReel = useCallback((entry: GalleryEntry) => {
    setBrowserUrl(mediaUrl("reels", entry.id), "replace");
  }, []);

  // Native browser back/forward should open/close the current media correctly.
  useEffect(() => {
    const handlePopState = () => {
      const itemId = new URLSearchParams(window.location.search).get("item");

      if (!itemId) {
        setLightboxList(null);
        setLightboxIdx(null);
        setReelsList(null);
        setReelsStartIdx(null);
        return;
      }

      const list = TAB_META[tab].entries;
      const idx = list.findIndex((entry) => entry.id === itemId);
      if (idx === -1) return;

      if (tab === "reels") {
        setReelsList(list);
        setReelsStartIdx(idx);
      } else {
        setLightboxList(list);
        setLightboxIdx(idx);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [tab]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>The Raven&apos;s Eye</h1>
        <p className={styles.subtitle}>
          Visions carried on black wings — and whatever else lands in the
          basket.
        </p>
      </div>

      <TabBar active={tab} />

      {tab === "reels" ? (
        <ReelsGridSection
          entries={activeMeta.entries}
          emptyLabel={activeMeta.emptyLabel}
          intro={activeMeta.intro(activeMeta.entries.length)}
          onOpen={openReels}
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
          onPrev={() => moveLightbox(-1)}
          onNext={() => moveLightbox(1)}
          hasPrev={lightboxIdx > 0}
          hasNext={lightboxIdx < lightboxList.length - 1}
        />
      )}

      {reelsList && reelsStartIdx !== null && (
        <ReelsViewer
          entries={reelsList}
          startIndex={reelsStartIdx}
          onClose={closeReels}
          onActiveEntry={handleActiveReel}
        />
      )}
    </div>
  );
}

export function RavensEyePageContent({
  forcedTab,
}: {
  forcedTab?: RavensEyeTab;
}) {
  return (
    <Suspense fallback={null}>
      <RavensEyePageInner forcedTab={forcedTab} />
    </Suspense>
  );
}

