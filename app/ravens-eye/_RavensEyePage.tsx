// app/ravens-eye/_RavensEyePage.tsx
"use client";

import PageTitleIcon from "@/components/nav/PageTitleIcon";
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
import GutterComments from "@/components/gallery/GutterComments";
import { useCommunity } from "@/lib/communityStore";
import { getGutterComments, isGutterEntry } from "@/lib/fleaBottom";

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

function reelPosterSrc(src: string) {
  const clean = src.split("?")[0].split("#")[0];
  const filename = clean.split("/").pop() ?? "reel";
  const base = filename.replace(/\.[^.]+$/, "");
  return `/videos/reels/posters/${encodeURIComponent(base)}.webp`;
}

const MEDIA_BATCH_INITIAL = 30;
const MEDIA_BATCH_STEP = 24;

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
    label: "Gutter Memes",
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

function mediaUrl(
  tab: RavensEyeTab,
  id?: string,
  characterId?: string,
  returnTo?: string
) {
  const base = TAB_META[tab].href;
  const params = new URLSearchParams();

  if (characterId) params.set("character", characterId);
  if (id) params.set("item", id);
  if (returnTo) params.set("returnTo", returnTo);

  const query = params.toString();
  return query ? `${base}?${query}` : base;
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
      {hasPrev && !isGutterEntry(entry) && (
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
        className={`${styles.lightboxCard} ${isGutterEntry(entry) ? styles.gutterLightbox : ""}`}
      >
        {isGutterEntry(entry) && (
          <div className={styles.gutterToolbar}>
            <button type="button" onClick={onPrev} disabled={!hasPrev} aria-label="Previous">← Previous</button>
            <button type="button" onClick={onNext} disabled={!hasNext} aria-label="Next">Next →</button>
            <button type="button" onClick={onClose} aria-label="Close">Close ×</button>
          </div>
        )}
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
          {isGutterEntry(entry) && <GutterComments key={entry.id} entryId={entry.id} />}
        </div>
      </div>

      {hasNext && !isGutterEntry(entry) && (
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

      {!isGutterEntry(entry) && <button
        type="button"
        onClick={onClose}
        className={styles.closeBtn}
        aria-label="Close"
      >
        ✕
      </button>}
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

function ReelPoster({ entry, className }: { entry: GalleryEntry; className: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className={`${className} ${styles.reelPosterFallback}`} aria-hidden="true" />;
  }

  return (
    <img
      src={reelPosterSrc(entry.src)}
      alt=""
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      aria-hidden="true"
    />
  );
}


type RavenShareTarget = {
  id: string;
  kind: "raven" | "guild";
  title: string;
  subtitle: string;
  avatarUrl: string | null;
  initials: string;
  updatedAt: string;
};

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function CommentGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.2 5.8A7.7 7.7 0 0 1 12 2.8a7.7 7.7 0 0 1 6.8 3 7.3 7.3 0 0 1 .7 7.9A7.7 7.7 0 0 1 12 18.2c-1.1 0-2.2-.2-3.2-.6L4.4 20l1-4.5A7.3 7.3 0 0 1 5.2 5.8Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function ShareGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 3 9.6 14.4M21 3l-6.2 18-5.2-6.6L3 9.2 21 3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.6 14.4 14.4 9.6M8 17H6.5a4.5 4.5 0 0 1 0-9H10M16 7h1.5a4.5 4.5 0 0 1 0 9H14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ReelCommentsSheet({ entry, onClose }: { entry: GalleryEntry; onClose: () => void }) {
  return (
    <>
      <button type="button" className={styles.reelSheetBackdrop} onClick={onClose} aria-label="Close comments" />
      <aside
        className={`${styles.reelSheet} ${styles.reelCommentsSheet}`}
        aria-label="Reel comments"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className={styles.reelSheetHeader}>
          <div>
            <span>Flea Bottom</span>
            <strong>Gutter talk</strong>
          </div>
          <button type="button" className={styles.reelSheetClose} onClick={onClose} aria-label="Close comments">
            <CloseGlyph />
          </button>
        </div>
        <div className={styles.reelCommentsScroll}>
          <GutterComments entryId={entry.id} />
        </div>
      </aside>
    </>
  );
}

function ReelShareSheet({ entry, onClose }: { entry: GalleryEntry; onClose: () => void }) {
  const [targets, setTargets] = useState<RavenShareTarget[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setStatus("");
    void fetch("/api/direct-raven/share-reel", { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Raven paths could not be loaded.");
        setTargets(Array.isArray(payload.targets) ? payload.targets : []);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus(error instanceof Error ? error.message : "Raven paths could not be loaded.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const visibleTargets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return targets;
    return targets.filter((target) => `${target.title} ${target.subtitle}`.toLowerCase().includes(needle));
  }, [query, targets]);

  const toggleTarget = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  const send = async () => {
    if (!selected.length || sending) return;
    setSending(true);
    setStatus("");
    try {
      const response = await fetch("/api/direct-raven/share-reel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: entry.id, conversationIds: selected, message }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "The reel could not be sent.");
      const messages = Array.isArray(payload.messages) ? payload.messages : [];
      await Promise.allSettled(messages.map((message: { id: string }) => fetch("/api/notifications/direct-raven", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: message.id }),
      })));
      setStatus(messages.length === 1 ? "Reel sent by raven." : `Reel sent down ${messages.length} Raven paths.`);
      window.setTimeout(onClose, 650);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The reel could not be sent.");
    } finally {
      setSending(false);
    }
  };

  const copyLink = async () => {
    try {
      const url = `${window.location.origin}${mediaUrl("reels", entry.id)}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setStatus("The link could not be copied on this device.");
    }
  };

  return (
    <>
      <button type="button" className={styles.reelSheetBackdrop} onClick={onClose} aria-label="Close share panel" />
      <aside
        className={`${styles.reelSheet} ${styles.reelShareSheet}`}
        aria-label="Share reel"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className={styles.reelSheetHeader}>
          <div>
            <span>Send by raven</span>
            <strong>Share this reel</strong>
          </div>
          <button type="button" className={styles.reelSheetClose} onClick={onClose} aria-label="Close share panel">
            <CloseGlyph />
          </button>
        </div>

        <div className={styles.reelSharePreview}>
          <ReelPoster entry={entry} className={styles.reelSharePoster} />
          <div>
            <span>Gutter Reel</span>
            <p>{entry.caption || "A reel from Flea Bottom"}</p>
          </div>
        </div>

        <label className={styles.reelShareMessage}>
          <span>Add a message</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, 1200))}
            placeholder="Say something with this reel…"
            rows={2}
            maxLength={1200}
          />
        </label>

        <label className={styles.reelShareSearch}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.8" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m15 15 5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ravens and parleys" />
        </label>

        <div className={styles.reelShareTargets}>
          {loading && <p className={styles.reelShareEmpty}>Calling the rookery…</p>}
          {!loading && !visibleTargets.length && !status && <p className={styles.reelShareEmpty}>No Raven paths found.</p>}
          {visibleTargets.map((target) => {
            const checked = selected.includes(target.id);
            return (
              <button
                type="button"
                key={target.id}
                className={`${styles.reelShareTarget} ${checked ? styles.reelShareTargetSelected : ""}`}
                onClick={() => toggleTarget(target.id)}
                aria-pressed={checked}
              >
                <span className={styles.reelShareAvatar}>
                  {target.avatarUrl ? <img src={target.avatarUrl} alt="" /> : target.initials}
                </span>
                <span className={styles.reelShareIdentity}>
                  <strong>{target.title}</strong>
                  <small>{target.subtitle}</small>
                </span>
                <span className={styles.reelShareCheck} aria-hidden="true">
                  {checked && <svg viewBox="0 0 24 24"><path d="m6.5 12.5 3.3 3.3 7.7-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </span>
              </button>
            );
          })}
        </div>

        {status && <p className={styles.reelShareStatus} role="status">{status}</p>}

        <div className={styles.reelShareFooter}>
          <button type="button" className={styles.reelCopyLink} onClick={() => void copyLink()}>
            <LinkGlyph />
            <span>{copied ? "Copied" : "Copy link"}</span>
          </button>
          <button type="button" className={styles.reelSendButton} disabled={!selected.length || sending} onClick={() => void send()}>
            <ShareGlyph />
            <span>{sending ? "Sending…" : selected.length > 1 ? `Send to ${selected.length}` : "Send"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function ReelSlide({
  entry,
  onActive,
  loadVideo,
  isActive,
  initialCommentsOpen = false,
}: {
  entry: GalleryEntry;
  onActive: (entry: GalleryEntry) => void;
  loadVideo: boolean;
  isActive: boolean;
  initialCommentsOpen?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const iconTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showIcon, setShowIcon] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(initialCommentsOpen);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const slide = slideRef.current;
    if (!slide) return;

    const observer = new IntersectionObserver(
      ([intersection]) => {
        const video = videoRef.current;
        if (
          intersection.isIntersecting &&
          intersection.intersectionRatio > 0.6
        ) {
          onActive(entry);
          if (video) {
            video
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          }
        } else if (video) {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: [0, 0.6, 1] }
    );

    observer.observe(slide);
    return () => observer.disconnect();
  }, [entry, onActive, loadVideo]);

  useEffect(() => {
    return () => {
      if (iconTimeout.current) clearTimeout(iconTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (initialCommentsOpen) setCommentsOpen(true);
  }, [initialCommentsOpen]);

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
      {loadVideo ? (
        <video
          ref={videoRef}
          src={entry.src}
          poster={reelPosterSrc(entry.src)}
          className={styles.reelVideo}
          loop
          playsInline
          preload={isActive ? "auto" : "metadata"}
          onTimeUpdate={updateProgress}
          onLoadedMetadata={updateProgress}
          onDurationChange={updateProgress}
        />
      ) : (
        <ReelPoster entry={entry} className={styles.reelVideo} />
      )}

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

      <div className={styles.reelDesktopCluster}>
        <div className={styles.reelActionRail} aria-label="Reel actions">
          <button
            type="button"
            className={styles.reelActionButton}
            onClick={(event) => {
              event.stopPropagation();
              setShareOpen(false);
              setCommentsOpen(true);
            }}
            aria-label={`Open ${getGutterComments(entry.id).length} comments`}
          >
            <span className={styles.reelActionIcon}><CommentGlyph /></span>
            <small>{getGutterComments(entry.id).length}</small>
          </button>
          <button
            type="button"
            className={styles.reelActionButton}
            onClick={(event) => {
              event.stopPropagation();
              setCommentsOpen(false);
              setShareOpen(true);
            }}
            aria-label="Share this reel"
          >
            <span className={styles.reelActionIcon}><ShareGlyph /></span>
          </button>
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
      </div>

      {commentsOpen && <ReelCommentsSheet entry={entry} onClose={() => setCommentsOpen(false)} />}
      {shareOpen && <ReelShareSheet entry={entry} onClose={() => setShareOpen(false)} />}

      {loadVideo && (
        <ReelProgress
          videoRef={videoRef}
          progress={progress}
          onSeek={setProgress}
        />
      )}
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
  const searchParams = useSearchParams();
  const requestedCommentItem = searchParams.get("comment") ? searchParams.get("item") : null;
  const [activeIndex, setActiveIndex] = useState(startIndex);

  const handleActive = useCallback(
    (entry: GalleryEntry) => {
      const index = entries.findIndex((candidate) => candidate.id === entry.id);
      if (index >= 0) setActiveIndex(index);
      onActiveEntry(entry);
    },
    [entries, onActiveEntry]
  );

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
      {entries.map((entry, index) => (
        <ReelSlide
          key={entry.id}
          entry={entry}
          onActive={handleActive}
          loadVideo={Math.abs(index - activeIndex) <= 1}
          isActive={index === activeIndex}
          initialCommentsOpen={requestedCommentItem === entry.id}
        />
      ))}

      <button
        type="button"
        onClick={onClose}
        className={styles.reelsCloseBtn}
        aria-label="Close"
      >
        <CloseGlyph />
      </button>
    </div>
  );
}

// ── Tab bar ────────────────────────────────────────────────────────────────

function TabBar({
  active,
  characterFilter,
}: {
  active: RavensEyeTab;
  characterFilter?: string;
}) {
  return (
    <nav className={styles.tabBar} aria-label="Raven's Eye sections">
      {(Object.keys(TAB_META) as RavensEyeTab[]).map((id) => {
        const meta = TAB_META[id];
        const count = characterFilter
          ? meta.entries.filter((entry) =>
              entry.characterIds.includes(characterFilter)
            ).length
          : meta.entries.length;
        const href = characterFilter
          ? `${meta.href}?character=${encodeURIComponent(characterFilter)}`
          : meta.href;

        return (
          <a
            key={id}
            href={href}
            className={`${styles.tabBtn} ${
              active === id ? styles.tabBtnActive : ""
            }`}
            aria-current={active === id ? "page" : undefined}
          >
            <span className={styles.tabLabelFull}>{meta.label}</span>
            <span className={styles.tabLabelMobile}>{meta.label}</span>
            {count > 0 && <span className={styles.tabCount}>{count}</span>}
          </a>
        );
      })}
    </nav>
  );
}

// ── Shared filters ──────────────────────────────────────────────────────────

function useGalleryFilters(
  entries: GalleryEntry[],
  initialCharacter = ""
) {
  const [filterChar, setFilterChar] = useState(initialCharacter);
  const [filterHouse, setFilterHouse] = useState("");
  const [filterDragon, setFilterDragon] = useState("");
  const [sort, setSort] = useState<SortKey>("uploadedAt");

  useEffect(() => {
    setFilterChar(initialCharacter);
  }, [initialCharacter]);

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
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const charOptions = [{ id: "", name: "All characters" }, ...characters];
  const houseOptions = [
    { id: "", name: "All houses" },
    ...houses.map((h) => ({ id: h.id, name: h.name })),
  ];
  const dragonOptions = [{ id: "", name: "All dragons" }, ...dragons];
  const activeFilterCount = [filterChar, filterHouse, filterDragon].filter(Boolean).length;
  const activeSort = SORT_OPTIONS.find((option) => option.id === sort)?.name ?? "Sort";

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!toolbarRef.current?.contains(event.target as Node)) {
        setFilterOpen(false);
        setSortOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFilterOpen(false);
        setSortOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className={styles.filterToolbar} ref={toolbarRef}>
      <div className={styles.filterToolbarRow}>
        <button
          type="button"
          className={`${styles.filterMenuButton} ${filterOpen ? styles.filterMenuButtonActive : ""}`}
          aria-expanded={filterOpen}
          aria-controls="ravens-eye-filter-panel"
          onClick={() => {
            setFilterOpen((open) => !open);
            setSortOpen(false);
          }}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 4.5h14L11.7 10v4.2l-3.4 1.5V10L3 4.5Z" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
          </svg>
          <span>Filters</span>
          {activeFilterCount > 0 && <span className={styles.filterBadge}>{activeFilterCount}</span>}
        </button>

        <div className={styles.filterToolbarRule} aria-hidden="true" />

        <div className={styles.sortMenuWrap}>
          <button
            type="button"
            className={`${styles.sortIconButton} ${sortOpen ? styles.sortIconButtonActive : ""}`}
            aria-label={`Sort · ${activeSort}`}
            aria-expanded={sortOpen}
            aria-controls="ravens-eye-sort-menu"
            title={`Sort · ${activeSort}`}
            onClick={() => {
              setSortOpen((open) => !open);
              setFilterOpen(false);
            }}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 4v11m0 0-2.5-2.5M5 15l2.5-2.5M15 16V5m0 0-2.5 2.5M15 5l2.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {sortOpen && (
            <div id="ravens-eye-sort-menu" className={styles.sortMenu} role="menu" aria-label="Sort Raven's Eye">
              <span className={styles.sortMenuLabel}>Sort</span>
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={sort === option.id}
                  className={sort === option.id ? styles.sortOptionActive : ""}
                  onClick={() => {
                    setSort(option.id as SortKey);
                    setSortOpen(false);
                  }}
                >
                  <span>{option.name}</span>
                  {sort === option.id && <span className={styles.sortCheck} aria-hidden="true">✦</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {filterOpen && (
        <div id="ravens-eye-filter-panel" className={styles.filterPanel}>
          <div className={styles.filterPanelHeading}>
            <span>Filter the archive</span>
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
                Clear
              </button>
            )}
          </div>
          <div className={styles.filterSelectStack}>
            {characters.length > 0 && (
              <label>
                <span>Character</span>
                <Select value={filterChar} options={charOptions} onChange={setFilterChar} searchable />
              </label>
            )}
            {houses.length > 0 && (
              <label>
                <span>House</span>
                <Select value={filterHouse} options={houseOptions} onChange={setFilterHouse} searchable />
              </label>
            )}
            {dragons.length > 0 && (
              <label>
                <span>Dragon</span>
                <Select value={filterDragon} options={dragonOptions} onChange={setFilterDragon} searchable />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Image gallery ───────────────────────────────────────────────────────────

function GallerySection({
  entries,
  emptyLabel,
  intro,
  onOpen,
  initialCharacter,
}: {
  entries: GalleryEntry[];
  emptyLabel: string;
  intro: string;
  onOpen: (list: GalleryEntry[], idx: number) => void;
  initialCharacter?: string;
}) {
  const filters = useGalleryFilters(entries, initialCharacter);
  const { filtered, anyFilter } = filters;
  const [visibleCount, setVisibleCount] = useState(MEDIA_BATCH_INITIAL);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= filtered.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((current) => Math.min(filtered.length, current + MEDIA_BATCH_STEP));
        }
      },
      { rootMargin: "900px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filtered.length, visibleCount]);

  const visibleEntries = filtered.slice(0, visibleCount);

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
          {visibleEntries.map((entry, idx) => {
            const tags = flatTagsFor(entry);

            return (
              <div
                key={entry.id}
                onClick={() => onOpen(filtered, idx)}
                className={styles.card}
                role="button"
                tabIndex={0}
                aria-label={`Open ${entry.caption || "gallery image"}`}
                onKeyDown={(event) => {
                  if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    onOpen(filtered, idx);
                  }
                }}
              >
                <img
                  src={entry.src}
                  alt={entry.caption || "Gallery image"}
                  loading={idx < 6 ? "eager" : "lazy"}
                  fetchPriority={idx < 3 ? "high" : "auto"}
                  decoding="async"
                  className={styles.cardImg}
                />
                {isGutterEntry(entry) && (
                  <span className={styles.commentCount}>{getGutterComments(entry.id).length} comments</span>
                )}

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

      {visibleCount < filtered.length && (
        <div ref={sentinelRef} className={styles.mediaLoadSentinel} aria-hidden="true" />
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
  initialCharacter,
}: {
  entries: GalleryEntry[];
  emptyLabel: string;
  intro: string;
  onOpen: (list: GalleryEntry[], idx: number) => void;
  initialCharacter?: string;
}) {
  const filters = useGalleryFilters(entries, initialCharacter);
  const { filtered, anyFilter } = filters;
  const [visibleCount, setVisibleCount] = useState(MEDIA_BATCH_INITIAL);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= filtered.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((current) => Math.min(filtered.length, current + MEDIA_BATCH_STEP));
        }
      },
      { rootMargin: "900px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filtered.length, visibleCount]);

  const visibleEntries = filtered.slice(0, visibleCount);

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
          {visibleEntries.map((entry, idx) => (
            <div
              key={entry.id}
              onClick={() => onOpen(filtered, idx)}
              className={styles.reelCard}
              role="button"
              tabIndex={0}
              aria-label={`Open reel: ${entry.caption.split("\n")[0] || "Gutter reel"}`}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpen(filtered, idx);
                }
              }}
            >
              <ReelPoster entry={entry} className={styles.reelThumb} />
              <span className={styles.commentCount}>{getGutterComments(entry.id).length} comments</span>

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

      {visibleCount < filtered.length && (
        <div ref={sentinelRef} className={styles.mediaLoadSentinel} aria-hidden="true" />
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
  useCommunity();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab: RavensEyeTab = forcedTab ?? "raven";
  const characterFilter = searchParams.get("character") ?? "";
  const returnTo = searchParams.get("returnTo") ?? "";

  const [lightboxList, setLightboxList] = useState<GalleryEntry[] | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const [reelsList, setReelsList] = useState<GalleryEntry[] | null>(null);
  const [reelsStartIdx, setReelsStartIdx] = useState<number | null>(null);

  const activeMeta = TAB_META[tab];
  const activeEntriesForCharacter = useMemo(
    () =>
      characterFilter
        ? activeMeta.entries.filter((entry) =>
            entry.characterIds.includes(characterFilter)
          )
        : activeMeta.entries,
    [activeMeta.entries, characterFilter]
  );

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

    const idx = activeEntriesForCharacter.findIndex((e) => e.id === itemId);

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

        const keepCharacterFilter =
          !characterFilter || globalEntry.characterIds.includes(characterFilter);

        const correctedUrl = new URL(
          mediaUrl(
            correctTab,
            globalEntry.id,
            keepCharacterFilter ? characterFilter || undefined : undefined
          ), window.location.origin
        );
        const targetComment = searchParams.get("comment");
        if (returnTo) correctedUrl.searchParams.set("returnTo", returnTo);
        if (targetComment) correctedUrl.searchParams.set("comment", targetComment);
        router.replace(correctedUrl.pathname + correctedUrl.search + (targetComment ? `#comment-${encodeURIComponent(targetComment)}` : ""));
      }

      return;
    }

    if (tab === "reels") {
      setReelsList(activeEntriesForCharacter);
      setReelsStartIdx(idx);
      setLightboxList(null);
      setLightboxIdx(null);
    } else {
      setLightboxList(activeEntriesForCharacter);
      setLightboxIdx(idx);
      setReelsList(null);
      setReelsStartIdx(null);
    }
  }, [
    activeEntriesForCharacter,
    characterFilter,
    router,
    searchParams,
    returnTo,
    tab,
  ]);

  const openLightbox = useCallback(
    (list: GalleryEntry[], idx: number) => {
      setLightboxList(list);
      setLightboxIdx(idx);
      setBrowserUrl(
        mediaUrl(tab, list[idx].id, characterFilter || undefined, returnTo || undefined)
      );
    },
    [characterFilter, returnTo, tab]
  );

  const closeLightbox = useCallback(() => {
    // When this lightbox was opened from another page, keep the overlay mounted
    // until Next has replaced the route. Clearing it first briefly exposes the
    // Raven's Eye page and causes the visible 1–2 second flash.
    if (returnTo) { router.replace(returnTo); return; }
    setLightboxList(null);
    setLightboxIdx(null);
    setBrowserUrl(mediaUrl(tab, undefined, characterFilter || undefined));
  }, [characterFilter, returnTo, router, tab]);

  const moveLightbox = useCallback(
    (direction: -1 | 1) => {
      setLightboxIdx((current) => {
        if (current === null || !lightboxList) return current;
        const next = current + direction;

        if (next < 0 || next >= lightboxList.length) return current;

        setBrowserUrl(
          mediaUrl(
            tab,
            lightboxList[next].id,
            characterFilter || undefined,
            returnTo || undefined
          ),
          "replace"
        );
        return next;
      });
    },
    [characterFilter, lightboxList, returnTo, tab]
  );

  const openReels = useCallback(
    (list: GalleryEntry[], idx: number) => {
      setReelsList(list);
      setReelsStartIdx(idx);
      setBrowserUrl(
        mediaUrl("reels", list[idx].id, characterFilter || undefined, returnTo || undefined)
      );
    },
    [characterFilter, returnTo]
  );

  const closeReels = useCallback(() => {
    // Same no-flash behavior as the image lightbox: do not reveal the Raven's
    // Eye route underneath while returning to the originating page.
    if (returnTo) { router.replace(returnTo); return; }
    setReelsList(null);
    setReelsStartIdx(null);
    setBrowserUrl(
      mediaUrl("reels", undefined, characterFilter || undefined)
    );
  }, [characterFilter, returnTo, router]);

  const handleActiveReel = useCallback(
    (entry: GalleryEntry) => {
      const current = new URLSearchParams(window.location.search);
      if (current.get("item") === entry.id && current.has("comment")) return;
      setBrowserUrl(
        mediaUrl("reels", entry.id, characterFilter || undefined, returnTo || undefined),
        "replace"
      );
    },
    [characterFilter, returnTo]
  );

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

      const list = characterFilter
        ? TAB_META[tab].entries.filter((entry) =>
            entry.characterIds.includes(characterFilter)
          )
        : TAB_META[tab].entries;
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
  }, [characterFilter, tab]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={`${styles.title} realm-page-title`}>The Raven&apos;s Eye<PageTitleIcon name="eye" /></h1>
        <p className={styles.subtitle}>
          Visions carried on black wings — and whatever else lands in the
          basket.
        </p>
      </div>

      <TabBar active={tab} characterFilter={characterFilter || undefined} />

      {tab === "reels" ? (
        <ReelsGridSection
          entries={activeMeta.entries}
          emptyLabel={activeMeta.emptyLabel}
          intro={activeMeta.intro(activeMeta.entries.length)}
          onOpen={openReels}
          initialCharacter={characterFilter}
        />
      ) : (
        <GallerySection
          key={tab}
          entries={activeMeta.entries}
          emptyLabel={activeMeta.emptyLabel}
          intro={activeMeta.intro(activeMeta.entries.length)}
          onOpen={openLightbox}
          initialCharacter={characterFilter}
        />
      )}

      {lightboxList && lightboxIdx !== null && (
        <Lightbox
          key={lightboxList[lightboxIdx].id}
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
          key={`${reelsList[reelsStartIdx]?.id ?? "reel"}-${reelsStartIdx}`}
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

