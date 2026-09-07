"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import charactersData from "@/data/characters/characters.json";
import galleryData from "@/data/gallery.json";
import housesData from "@/data/houses.json";
import dragonsData from "@/data/dragons.json";
import type { Character, CharacterAgeState } from "@/types/character";
import {
  CHARACTER_AGE_STATES,
  computeAge,
  daysUntilNextNameday,
  formatDaysUntil,
  formatDeathDate,
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
  baby: "Baby",
  kid: "Kid",
  teen: "Teen",
  young: "Young",
  adult: "Adult",
  old: "Old",
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

  const namedayLabel = character.nameday
    ? formatNameday(character.nameday, worldDate.era)
    : "-";

  const namedayCountdown = character.nameday
    ? formatDaysUntil(daysUntilNextNameday(character.nameday, worldDate))
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
              sizes="320px"
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
                  value={<CharacterListValue values={character.siblings} />}
                />
              )}

              {(character.children ?? []).some(isValidValue) && (
                <InfoRow
                  label="Children"
                  compact
                  value={<CharacterListValue values={character.children} />}
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
                      {video && <span className={styles.playBadge}>▶</span>}
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
            <div className={styles.modalGrid}>
              {activeEntries.map((entry, index) => {
                const video = isVideo(entry.src);

                return (
                  <button
                    key={entry.id}
                    type="button"
                    className={styles.modalMediaCard}
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
                    {video && <span className={styles.modalPlay}>▶</span>}
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

        {selected && (
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

              {isVideo(selected.src) ? (
                <video
                  src={selected.src}
                  controls
                  autoPlay
                  playsInline
                  className={styles.viewerMedia}
                />
              ) : (
                <img
                  src={selected.src}
                  alt={selected.caption || "Gallery image"}
                  className={styles.viewerMedia}
                />
              )}

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
        )}
      </div>
    </div>,
    document.body
  );
}
