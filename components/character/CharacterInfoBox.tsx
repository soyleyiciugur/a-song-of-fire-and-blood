"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import charactersData from "@/data/characters/characters.json";
import galleryData from "@/data/gallery.json";
import housesData from "@/data/houses.json";
import dragonsData from "@/data/dragons.json";
import type { Character, CharacterAgeState } from "@/types/character";
import {
  CHARACTER_AGE_STATES,
  computeAge,
  daysUntilNextNameday,
  daysUntilNextGregorianNameday,
  formatDaysUntil,
  formatDeathDate,
  formatGregorianNameday,
  formatNameday,
} from "@/lib/age";
import worldDate from "@/data/worldDate.json";
import StatusReveal from "./StatusReveal";
import styles from "./characterInfoBox.module.css";

type PortraitVariants = Partial<Record<CharacterAgeState, string>>;

type Props = {
  character: Character;
  currentAgeState: CharacterAgeState;
  portraitVariants: PortraitVariants;
};

type GalleryEntry = {
  id: string;
  src: string;
  caption: string;
  characterIds: string[];
  houseIds: string[];
  dragonIds: string[];
  chapterId: string | null;
  worldDate: {
    day: number;
    moon: number;
    year: number;
    era: string;
  } | null;
  uploadedAt: string;
  category?: "raven" | "fleabottom";
};

type GalleryTab = "raven" | "memes" | "reels";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"];

const AGE_STATE_LABELS: Record<CharacterAgeState, string> = {
  baby: "Babe",
  kid: "Child",
  teen: "Youth",
  young: "Young",
  adult: "Adult",
  old: "Elder",
};

function isVideo(src: string) {
  const clean = src.split("?")[0].split("#")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((extension) => clean.endsWith(extension));
}

function withPosterFrame(src: string) {
  return `${src}#t=0.1`;
}

function galleryTabFor(entry: GalleryEntry): GalleryTab {
  if (isVideo(entry.src)) return "reels";
  if (entry.category === "fleabottom") return "memes";
  return "raven";
}

function galleryHref(tab: GalleryTab, characterId: string, itemId?: string) {
  const base =
    tab === "raven"
      ? "/ravens-eye"
      : tab === "memes"
        ? "/ravens-eye/memes"
        : "/ravens-eye/reels";

  const params = new URLSearchParams({ character: characterId });
  if (itemId) params.set("item", itemId);

  return `${base}?${params.toString()}`;
}

function isValidValue(value?: string | null): value is string {
  return Boolean(value && value !== "-");
}

const characterList = charactersData as Character[];
const houseList = housesData as { id: string; name: string }[];
const dragonList = dragonsData as { id: string; name: string }[];
const allGalleryEntries = galleryData as GalleryEntry[];

function resolveCharacter(value?: string | null) {
  if (!isValidValue(value)) return null;
  const normalized = value.toLowerCase();

  return (
    characterList.find(
      (character) =>
        character.id.toLowerCase() === normalized ||
        character.name.toLowerCase() === normalized
    ) ?? null
  );
}

function resolveHouse(value?: string | null) {
  if (!isValidValue(value)) return null;
  const normalized = value.toLowerCase();

  return (
    houseList.find(
      (house) =>
        house.id.toLowerCase() === normalized ||
        house.name.toLowerCase() === normalized
    ) ?? null
  );
}

function resolveDragon(value?: string | null) {
  if (!isValidValue(value)) return null;
  const normalized = value.toLowerCase();

  return (
    dragonList.find(
      (dragon) =>
        dragon.id.toLowerCase() === normalized ||
        dragon.name.toLowerCase() === normalized
    ) ?? null
  );
}

function sortCharacterRefsOldestFirst(values?: string[]) {
  return [...(values ?? [])].sort((a, b) => {
    const aCharacter = resolveCharacter(a);
    const bCharacter = resolveCharacter(b);

    const aNameday = aCharacter?.nameday;
    const bNameday = bCharacter?.nameday;

    if (aNameday && bNameday) {
      if (aNameday.year !== bNameday.year) {
        return aNameday.year - bNameday.year;
      }

      if (aNameday.moon !== bNameday.moon) {
        return aNameday.moon - bNameday.moon;
      }

      return aNameday.day - bNameday.day;
    }

    if (aNameday) return -1;
    if (bNameday) return 1;

    return 0;
  });
}

function CharacterValue({ value }: { value?: string | null }) {
  if (!isValidValue(value)) return <>-</>;

  const resolved = resolveCharacter(value);
  if (!resolved) return <>{value}</>;

  return (
    <Link href={`/characters/${resolved.id}`} className={styles.entityLink}>
      {resolved.name}
    </Link>
  );
}

function CharacterListValue({ values }: { values?: string[] }) {
  const valid = (values ?? []).filter(isValidValue);
  if (valid.length === 0) return <>-</>;

  return (
    <>
      {valid.map((value, index) => (
        <span key={`${value}-${index}`}>
          {index > 0 ? ", " : ""}
          <CharacterValue value={value} />
        </span>
      ))}
    </>
  );
}

function HouseValue({ value }: { value?: string | null }) {
  if (!isValidValue(value)) return <>-</>;

  const resolved = resolveHouse(value);
  if (!resolved) return <>{value}</>;

  return (
    <Link href={`/houses/${resolved.id}`} className={styles.entityLink}>
      {resolved.name}
    </Link>
  );
}

function DragonValue({ value }: { value?: string | null }) {
  if (!isValidValue(value)) return <>-</>;

  const resolved = resolveDragon(value);
  if (!resolved) return <>{value}</>;

  return (
    <Link href={`/dragons/${resolved.id}`} className={styles.entityLink}>
      {resolved.name}
    </Link>
  );
}

export default function CharacterInfoBox({
  character,
  currentAgeState,
  portraitVariants,
}: Props) {
  const [activeAgeState, setActiveAgeState] =
    useState<CharacterAgeState>(currentAgeState);
  const [imageFailed, setImageFailed] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryTab, setGalleryTab] = useState<GalleryTab>("raven");

  useEffect(() => {
    setActiveAgeState(currentAgeState);
  }, [character.id, currentAgeState]);

  const activePortrait =
    portraitVariants[activeAgeState] ?? portraitVariants[currentAgeState];

  useEffect(() => {
    setImageFailed(false);
  }, [activePortrait]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    Object.values(portraitVariants).forEach((src) => {
      if (!src) return;
      const image = new window.Image();
      image.src = src;
    });
  }, [portraitVariants]);

  const age =
    character.age ??
    (character.nameday
      ? computeAge(character.nameday, worldDate, character.death)
      : undefined);

  const isRealWorldNameday = character.id === "hrrm";

  const [realWorldNamedayCountdown, setRealWorldNamedayCountdown] =
    useState<string | null>(null);

  useEffect(() => {
    if (!isRealWorldNameday || !character.nameday) {
      setRealWorldNamedayCountdown(null);
      return;
    }

    const refresh = () => {
      setRealWorldNamedayCountdown(
        formatDaysUntil(
          daysUntilNextGregorianNameday(character.nameday!, new Date())
        )
      );
    };

    refresh();

    // Keeps an open HRRM profile correct across midnight without requiring reload.
    const interval = window.setInterval(refresh, 60 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [
    isRealWorldNameday,
    character.nameday?.day,
    character.nameday?.moon,
    character.nameday?.year,
  ]);

  const namedayLabel = character.nameday
    ? isRealWorldNameday
      ? formatGregorianNameday(character.nameday)
      : formatNameday(character.nameday, worldDate.era)
    : "-";

  const namedayCountdown = character.nameday
    ? isRealWorldNameday
      ? realWorldNamedayCountdown
      : formatDaysUntil(daysUntilNextNameday(character.nameday, worldDate))
    : null;

  const deathLabel = character.death
    ? formatDeathDate(character.death, worldDate.era)
    : null;

  const resolvedCharacterHouse = resolveHouse(character.house);

  const hasFamily = [
    character.father,
    character.mother,
    character.spouse,
    ...(character.siblings ?? []),
    ...(character.children ?? []),
  ].some(isValidValue);

  const taggedGallery = useMemo(
    () =>
      allGalleryEntries
        .filter((entry) => entry.characterIds.includes(character.id))
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    [character.id]
  );

  const sortedSiblings = useMemo(
    () => sortCharacterRefsOldestFirst(character.siblings),
    [character.siblings]
  );

  const sortedChildren = useMemo(
    () => sortCharacterRefsOldestFirst(character.children),
    [character.children]
  );

  const previewEntries = taggedGallery.slice(0, 3);

  function openGallery(tab: GalleryTab) {
    setGalleryTab(tab);
    setGalleryOpen(true);
  }

  return (
    <>
      <aside className={styles.box}>
        <div className={styles.ageStateBar} aria-label="Portrait age">
          {CHARACTER_AGE_STATES.map((state) => {
            const available = Boolean(portraitVariants[state]);
            const active = activeAgeState === state;

            return (
              <button
                key={state}
                type="button"
                disabled={!available}
                className={`${styles.ageStateButton} ${
                  active ? styles.ageStateButtonActive : ""
                }`}
                onClick={() => available && setActiveAgeState(state)}
                aria-pressed={active}
                title={
                  available
                    ? `${AGE_STATE_LABELS[state]} portrait`
                    : `No ${AGE_STATE_LABELS[state].toLowerCase()} portrait available`
                }
              >
                {AGE_STATE_LABELS[state]}
              </button>
            );
          })}
        </div>

        <div className={styles.portrait}>
          {activePortrait && !imageFailed ? (
            <Image
              key={activePortrait}
              src={activePortrait}
              alt={`${character.name} — ${AGE_STATE_LABELS[activeAgeState]}`}
              fill
              unoptimized
              className={styles.portraitImage}
              onError={() => setImageFailed(true)}
              priority
            />
          ) : (
            <div className={styles.portraitFallback}>
              <span>✦</span>
              <small>No portrait available</small>
            </div>
          )}
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles.mainHeading}>Information</h2>

            <InfoRow label="House" value={<HouseValue value={character.house} />} />

            <InfoRow
              label="Status"
              value={
                <StatusReveal status={character.status} secret={character.secret} />
              }
            />

            <InfoRow label="Title" value={character.title} />
            <InfoRow label="Age" value={age !== undefined ? String(age) : "-"} />

            <InfoRow
              label="Nameday"
              value={
                namedayCountdown ? (
                  <span
                    className={styles.namedayTooltip}
                    data-tooltip={namedayCountdown}
                    tabIndex={0}
                  >
                    {namedayLabel}
                  </span>
                ) : (
                  namedayLabel
                )
              }
            />

            {deathLabel && <InfoRow label="Died" value={deathLabel} />}

            <InfoRow label="Height" value={character.height ?? "-"} />
            <InfoRow label="Dragon" value={<DragonValue value={character.dragon} />} />

            {isValidValue(character.mentor) && (
              <InfoRow
                label="Mentor"
                value={<CharacterValue value={character.mentor} />}
              />
            )}
          </section>

          {hasFamily && (
            <section className={styles.section}>
              <div className={styles.sectionHeadingRow}>
                <h3 className={styles.sectionHeading}>Family</h3>
                {resolvedCharacterHouse && (
                  <Link
                    href={`/family-tree?focus=${encodeURIComponent(
                      character.id
                    )}#house-${resolvedCharacterHouse.id}`}
                    className={styles.sectionAction}
                  >
                    View tree →
                  </Link>
                )}
              </div>

              {isValidValue(character.father) && (
                <InfoRow
                  label="Father"
                  compact
                  value={<CharacterValue value={character.father} />}
                />
              )}

              {isValidValue(character.mother) && (
                <InfoRow
                  label="Mother"
                  compact
                  value={<CharacterValue value={character.mother} />}
                />
              )}

              {isValidValue(character.spouse) && (
                <InfoRow
                  label="Spouse"
                  compact
                  value={<CharacterValue value={character.spouse} />}
                />
              )}

              {(character.siblings ?? []).some(isValidValue) && (
                <InfoRow
                  label="Siblings"
                  compact
                  value={<CharacterListValue values={sortedSiblings} />}
                />
              )}

              {(character.children ?? []).some(isValidValue) && (
                <InfoRow
                  label="Children"
                  compact
                  value={<CharacterListValue values={sortedChildren} />}
                />
              )}
            </section>
          )}

          <section className={styles.section}>
            <div className={styles.sectionHeadingRow}>
              <button
                type="button"
                className={styles.galleryHeadingButton}
                onClick={() => openGallery("raven")}
              >
                Gallery
              </button>
              <span className={styles.galleryCount}>
                {taggedGallery.length} tagged
              </span>
            </div>

            {previewEntries.length > 0 ? (
              <div className={styles.galleryPreviewGrid}>
                {previewEntries.map((entry) => {
                  const tab = galleryTabFor(entry);
                  const video = isVideo(entry.src);

                  return (
                    <button
                      key={entry.id}
                      type="button"
                      className={styles.galleryPreview}
                      onClick={() => openGallery(tab)}
                      aria-label={`Open ${tab} gallery`}
                    >
                      {video ? (
                        <video
                          src={withPosterFrame(entry.src)}
                          muted
                          playsInline
                          preload="metadata"
                          className={styles.galleryPreviewMedia}
                        />
                      ) : (
                        <img
                          src={entry.src}
                          alt={entry.caption || "Tagged gallery image"}
                          loading="lazy"
                          className={styles.galleryPreviewMedia}
                        />
                      )}
                      {video && (
                        <span className={styles.playBadge}>
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className={styles.galleryEmpty}>No tagged media yet.</p>
            )}
          </section>
        </div>
      </aside>

      {galleryOpen && (
        <CharacterGalleryModal
          character={character}
          entries={taggedGallery}
          activeTab={galleryTab}
          onTabChange={setGalleryTab}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </>
  );
}

type RowProps = {
  label: string;
  value: React.ReactNode;
  compact?: boolean;
};

function InfoRow({ label, value, compact = false }: RowProps) {
  return (
    <div className={`${styles.infoRow} ${compact ? styles.infoRowCompact : ""}`}>
      <div className={styles.infoLabel}>{label}</div>
      <div className={styles.infoValue}>{value ?? "-"}</div>
    </div>
  );
}

function CharacterReelSlide({
  entry,
  characterId,
}: {
  entry: GalleryEntry;
  characterId: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const iconTimeout = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showIcon, setShowIcon] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    const slide = slideRef.current;
    if (!video || !slide) return;

    const observer = new IntersectionObserver(
      ([intersection]) => {
        if (intersection.isIntersecting && intersection.intersectionRatio > 0.6) {
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
  }, []);

  useEffect(() => {
    return () => {
      if (iconTimeout.current) window.clearTimeout(iconTimeout.current);
    };
  }, []);

  function flashIcon() {
    setShowIcon(true);
    if (iconTimeout.current) window.clearTimeout(iconTimeout.current);
    iconTimeout.current = window.setTimeout(() => setShowIcon(false), 500);
  }

  function togglePlayback() {
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
  }

  function updateProgress() {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      setProgress(0);
      return;
    }

    setProgress(video.currentTime / video.duration);
  }

  function seek(event: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    setProgress(ratio);
  }

  return (
    <div ref={slideRef} className={styles.characterReelSlide}>
      <video
        ref={videoRef}
        src={entry.src}
        className={styles.characterReelVideo}
        loop
        playsInline
        preload="metadata"
        onTimeUpdate={updateProgress}
        onLoadedMetadata={updateProgress}
        onDurationChange={updateProgress}
      />

      <button
        type="button"
        className={styles.characterReelTapCatcher}
        onClick={togglePlayback}
        aria-label={isPlaying ? "Pause reel" : "Play reel"}
      />

      <div
        className={`${styles.characterReelCenterIcon} ${
          showIcon ? styles.characterReelCenterIconVisible : ""
        }`}
      >
        {isPlaying ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" />
            <rect x="14" y="5" width="4" height="14" />
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </div>

      <div className={styles.characterReelMeta}>
        {entry.caption && <p>{entry.caption}</p>}
        <Link href={galleryHref("reels", characterId, entry.id)}>
          Open in Gutter Reels ↗
        </Link>
      </div>

      <div
        className={styles.characterReelProgressHitbox}
        onClick={seek}
        role="slider"
        aria-label="Reel progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div className={styles.characterReelProgressTrack}>
          <div
            className={styles.characterReelProgressFill}
            style={{ transform: `scaleX(${progress})` }}
          />
          <div
            className={styles.characterReelProgressThumb}
            style={{ left: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function CharacterReelsViewer({
  entries,
  startIndex,
  characterId,
  onClose,
}: {
  entries: GalleryEntry[];
  startIndex: number;
  characterId: string;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const slide = container.children[startIndex] as HTMLElement | undefined;
      slide?.scrollIntoView({ block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [startIndex]);

  return (
    <div className={styles.characterReelsViewer} ref={containerRef}>
      {entries.map((entry) => (
        <CharacterReelSlide
          key={entry.id}
          entry={entry}
          characterId={characterId}
        />
      ))}

      <button
        type="button"
        className={styles.characterReelsClose}
        onClick={onClose}
        aria-label="Close reels viewer"
      >
        ✕
      </button>
    </div>
  );
}

function CharacterGalleryModal({
  character,
  entries,
  activeTab,
  onTabChange,
  onClose,
}: {
  character: Character;
  entries: GalleryEntry[];
  activeTab: GalleryTab;
  onTabChange: (tab: GalleryTab) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (viewerIndex !== null) setViewerIndex(null);
        else onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, viewerIndex]);

  const byTab = useMemo(
    () => ({
      raven: entries.filter((entry) => galleryTabFor(entry) === "raven"),
      memes: entries.filter((entry) => galleryTabFor(entry) === "memes"),
      reels: entries.filter((entry) => galleryTabFor(entry) === "reels"),
    }),
    [entries]
  );

  const activeEntries = byTab[activeTab];
  const selected = viewerIndex === null ? null : activeEntries[viewerIndex];

  useEffect(() => {
    setViewerIndex(null);
  }, [activeTab]);

  if (!mounted) return null;

  return createPortal(
    <div className={styles.modalBackdrop} onMouseDown={onClose}>
      <div
        className={styles.galleryModal}
        role="dialog"
        aria-modal="true"
        aria-label={`${character.name} gallery`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Close gallery"
        >
          ×
        </button>

        <div className={styles.modalHeader}>
          <span className={styles.modalEyebrow}>Tagged media</span>
          <h2>{character.name}</h2>
        </div>

        <div className={styles.galleryTabs}>
          {(
            [
              ["raven", "Raven's Eye"],
              ["memes", "Memes"],
              ["reels", "Reels"],
            ] as [GalleryTab, string][]
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              className={`${styles.galleryTab} ${
                activeTab === tab ? styles.galleryTabActive : ""
              }`}
              onClick={() => onTabChange(tab)}
            >
              {label}
              <span>{byTab[tab].length}</span>
            </button>
          ))}
        </div>

        <div className={styles.modalBody}>
          {activeEntries.length === 0 ? (
            <div className={styles.modalEmpty}>Nothing tagged here yet.</div>
          ) : (
            <div
              className={`${styles.modalGrid} ${
                activeTab === "reels" ? styles.modalReelsGrid : ""
              }`}
            >
              {activeEntries.map((entry, index) => {
                const video = isVideo(entry.src);

                return (
                  <button
                    key={entry.id}
                    type="button"
                    className={`${styles.modalMediaCard} ${
                      video ? styles.modalReelCard : ""
                    }`}
                    onClick={() => setViewerIndex(index)}
                  >
                    {video ? (
                      <video
                        src={withPosterFrame(entry.src)}
                        muted
                        playsInline
                        preload="metadata"
                        className={styles.modalMedia}
                      />
                    ) : (
                      <img
                        src={entry.src}
                        alt={entry.caption || "Gallery image"}
                        loading="lazy"
                        className={styles.modalMedia}
                      />
                    )}
                    {video && (
                      <span className={styles.modalPlay}>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <Link
            href={galleryHref(activeTab, character.id)}
            className={styles.goToGallery}
          >
            Go to Gallery →
          </Link>
        </div>

        {selected && isVideo(selected.src) ? (
          <CharacterReelsViewer
            entries={activeEntries}
            startIndex={viewerIndex ?? 0}
            characterId={character.id}
            onClose={() => setViewerIndex(null)}
          />
        ) : selected ? (
          <div
            className={styles.viewerBackdrop}
            onMouseDown={() => setViewerIndex(null)}
          >
            <div
              className={styles.viewer}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className={styles.viewerClose}
                onClick={() => setViewerIndex(null)}
                aria-label="Close media viewer"
              >
                ×
              </button>

              <img
                src={selected.src}
                alt={selected.caption || "Gallery image"}
                className={styles.viewerMedia}
              />

              {selected.caption && (
                <p className={styles.viewerCaption}>{selected.caption}</p>
              )}

              {activeEntries.length > 1 && (
                <>
                  <button
                    type="button"
                    className={`${styles.viewerNav} ${styles.viewerPrev}`}
                    onClick={() =>
                      setViewerIndex((current) =>
                        current === null
                          ? 0
                          : (current - 1 + activeEntries.length) %
                            activeEntries.length
                      )
                    }
                    aria-label="Previous media"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className={`${styles.viewerNav} ${styles.viewerNext}`}
                    onClick={() =>
                      setViewerIndex((current) =>
                        current === null
                          ? 0
                          : (current + 1) % activeEntries.length
                      )
                    }
                    aria-label="Next media"
                  >
                    ›
                  </button>
                </>
              )}

              <Link
                href={galleryHref(activeTab, character.id, selected.id)}
                className={styles.viewerOpenInGallery}
              >
                Open in Raven&apos;s Eye ↗
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
