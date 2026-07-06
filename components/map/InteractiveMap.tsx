"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useMapViewport } from "@/lib/useMapViewport";
import {
  DEFAULT_MAP_FOCUS_SCALE,
  DEFAULT_MAP_LOCATION,
  MAP_LOCATIONS,
  getMapLocation,
} from "@/data/map/locations";
import { MAP_EVENTS } from "@/data/map/events";
import { getCharacterPositionsForChapter } from "@/data/map/character-positions";
import { getAllChapters } from "@/data/chapters";
import { getCharacters } from "@/lib/characters";
import { getTitleRank } from "@/constants/titles";
import type { MapEventType } from "@/types/map";
import { MAP_EVENT_TYPE_ICONS, MAP_EVENT_TYPE_LABELS } from "@/types/map";
import type { Character } from "@/types/character";

import styles from "./interactive-map.module.css";

const MAP_SRC = "/images/map/known-world.webp";
const MINI_FALLBACK = "/images/miniportraits/default.png";
const MAX_VISIBLE_AVATARS = 3;
const ALL_EVENT_TYPES: MapEventType[] = ["battle", "feast", "tournament", "wedding"];

const ROMAN_VALUES: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
};

function romanFromTitle(title: string): number {
  const match = title.match(/Chapter\s+([IVXLC]+)/i);
  if (!match) return 999;
  return ROMAN_VALUES[match[1].toUpperCase()] ?? 999;
}

function Avatar({
  characterId,
  name,
  size = 32,
}: {
  characterId: string;
  name: string;
  size?: number;
}) {
  const [src, setSrc] = useState(`/images/miniportraits/${characterId}.png`);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      draggable={false}
      onError={() => setSrc(MINI_FALLBACK)}
      className={styles.avatarImg}
      style={{ width: size, height: size }}
    />
  );
}

export default function InteractiveMap() {
  const router = useRouter();

  const chapters = useMemo(
    () => [...getAllChapters()].sort((a, b) => romanFromTitle(a.title) - romanFromTitle(b.title)),
    []
  );
  const characters = useMemo(() => getCharacters(), []);
  const charactersById = useMemo(() => {
    const map = new Map<string, Character>();
    characters.forEach((c) => map.set(c.id, c));
    return map;
  }, [characters]);

  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [openCluster, setOpenCluster] = useState<string | null>(null);
  const [activeEventTypes, setActiveEventTypes] = useState<Set<MapEventType>>(
    new Set(ALL_EVENT_TYPES)
  );

  const {
    viewportRef,
    scale,
    pan,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    consumeDragFlag,
    centerOn,
    zoomBy,
  } = useMapViewport({ minScale: 0.5, maxScale: 8 });

  const handleImageLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget;
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      setNaturalSize({ width, height });

      const kl = getMapLocation(DEFAULT_MAP_LOCATION);
      if (kl) centerOn(kl.xPct, kl.yPct, width, height, DEFAULT_MAP_FOCUS_SCALE);
    },
    [centerOn]
  );

  const currentChapter = chapters[chapterIndex];

  const currentPositions = useMemo(
    () => (currentChapter ? getCharacterPositionsForChapter(currentChapter.slug) : {}),
    [currentChapter]
  );

  // location name -> character ids present in the current chapter, sorted by title rank
  const charactersByLocation = useMemo(() => {
    const map = new Map<string, string[]>();
    Object.entries(currentPositions).forEach(([charId, location]) => {
      if (!location) return;
      const list = map.get(location) ?? [];
      list.push(charId);
      map.set(location, list);
    });
    map.forEach((list, key) => {
      list.sort((a, b) => {
        const ca = charactersById.get(a);
        const cb = charactersById.get(b);
        return getTitleRank(ca?.title ?? "") - getTitleRank(cb?.title ?? "");
      });
      map.set(key, list);
    });
    return map;
  }, [currentPositions, charactersById]);

  // Events that have happened by the current chapter, filtered by active types
  const visibleEventsByLocation = useMemo(() => {
    const map = new Map<string, typeof MAP_EVENTS>();
    MAP_EVENTS.forEach((event) => {
      if (!activeEventTypes.has(event.type)) return;
      const eventChapterIdx = chapters.findIndex((c) => c.slug === event.chapterSlug);
      if (eventChapterIdx === -1 || eventChapterIdx > chapterIndex) return;
      const list = map.get(event.location) ?? [];
      list.push(event);
      map.set(event.location, list);
    });
    return map;
  }, [activeEventTypes, chapters, chapterIndex]);

  // Trail for the selected character: one point per chapter (up to current) where we know their location.
  const trailPoints = useMemo(() => {
    if (!selectedCharacterId) return [];
    const points: { xPct: number; yPct: number; chapterIdx: number; roman: string }[] = [];
    for (let i = 0; i <= chapterIndex; i++) {
      const chapter = chapters[i];
      const positions = getCharacterPositionsForChapter(chapter.slug);
      const location = positions[selectedCharacterId as keyof typeof positions];
      if (!location) continue;
      const coords = getMapLocation(location);
      if (!coords) continue;
      const last = points[points.length - 1];
      if (last && last.xPct === coords.xPct && last.yPct === coords.yPct) continue;
      const romanMatch = chapter.title.match(/Chapter\s+([IVXLC]+)/i);
      points.push({
        xPct: coords.xPct,
        yPct: coords.yPct,
        chapterIdx: i,
        roman: romanMatch ? romanMatch[1] : String(i + 1),
      });
    }
    return points;
  }, [selectedCharacterId, chapterIndex, chapters]);

  const selectedCharacterCurrentLocation = useMemo(() => {
    if (!selectedCharacterId) return null;
    const location = currentPositions[selectedCharacterId as keyof typeof currentPositions];
    return location ? getMapLocation(location) : null;
  }, [selectedCharacterId, currentPositions]);

  const selectedCharacter = selectedCharacterId ? charactersById.get(selectedCharacterId) : null;

  const handleMapClick = useCallback(() => {
    // Clicking empty map area (not a drag) closes any open cluster popover.
    if (consumeDragFlag()) return;
    setOpenCluster(null);
  }, [consumeDragFlag]);

  const toggleEventType = useCallback((type: MapEventType) => {
    setActiveEventTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const jumpToChapter = useCallback((idx: number) => {
    setChapterIndex(Math.max(0, Math.min(chapters.length - 1, idx)));
  }, [chapters.length]);

  return (
    <div className={styles.frameOuter}>
      <div className={styles.frameInner}>
        <div
          ref={viewportRef}
          className={styles.viewport}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleMapClick}
        >
          <div
            className={styles.mapWrapper}
            style={{
              width: naturalSize?.width ?? "auto",
              height: naturalSize?.height ?? "auto",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={MAP_SRC}
              alt="The Known World"
              className={styles.mapImage}
              draggable={false}
              onLoad={handleImageLoad}
            />

            {/* Trail for selected character */}
            {trailPoints.length > 1 && (
              <svg
                className={styles.trailSvg}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="trailGradient" gradientUnits="userSpaceOnUse"
                    x1={trailPoints[0].xPct} y1={trailPoints[0].yPct}
                    x2={trailPoints[trailPoints.length - 1].xPct}
                    y2={trailPoints[trailPoints.length - 1].yPct}>
                    <stop offset="0%" stopColor="#f2d98a" />
                    <stop offset="50%" stopColor="#c9a227" />
                    <stop offset="100%" stopColor="#8a1f1f" />
                  </linearGradient>
                </defs>
                <polyline
                  points={trailPoints.map((p) => `${p.xPct},${p.yPct}`).join(" ")}
                  fill="none"
                  stroke="url(#trailGradient)"
                  strokeWidth="0.35"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  className={styles.trailPath}
                />
              </svg>
            )}

            {/* Trail waypoint markers (jump back to that chapter) */}
            {trailPoints.slice(0, -1).map((p) => (
              <button
                key={`waypoint-${p.chapterIdx}`}
                className={styles.waypoint}
                style={{ left: `${p.xPct}%`, top: `${p.yPct}%` }}
                title={`Chapter ${p.roman}`}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  jumpToChapter(p.chapterIdx);
                }}
              >
                {p.roman}
              </button>
            ))}

            {/* Location markers: characters + events */}
            {MAP_LOCATIONS.map((loc) => {
              const charIds = charactersByLocation.get(loc.name) ?? [];
              const events = visibleEventsByLocation.get(loc.name) ?? [];
              if (charIds.length === 0 && events.length === 0) return null;

              const visibleIds = charIds.slice(0, MAX_VISIBLE_AVATARS);
              const overflowIds = charIds.slice(MAX_VISIBLE_AVATARS);
              const clusterKey = `chars-${loc.name}`;
              const eventClusterKey = `events-${loc.name}`;

              const isCurrentEventChapter = (slug: string) =>
                chapters[chapterIndex]?.slug === slug;

              return (
                <div
                  key={loc.name}
                  className={styles.locationMarker}
                  style={{ left: `${loc.xPct}%`, top: `${loc.yPct}%` }}
                >
                  {charIds.length > 0 && (
                    <div className={styles.avatarRow}>
                      {visibleIds.map((id) => {
                        const c = charactersById.get(id);
                        const isSelected = id === selectedCharacterId;
                        const isPulsing =
                          isSelected &&
                          selectedCharacterCurrentLocation?.name === loc.name;
                        return (
                          <button
                            key={id}
                            className={`${styles.avatarButton} ${isSelected ? styles.avatarSelected : ""}`}
                            title={c?.name ?? id}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCharacterId(id === selectedCharacterId ? null : id);
                            }}
                          >
                            {isPulsing && <span className={styles.pulseRing} />}
                            <Avatar characterId={id} name={c?.name ?? id} />
                          </button>
                        );
                      })}

                      {overflowIds.length > 0 && (
                        <div
                          className={styles.overflowWrap}
                          onMouseEnter={() => setOpenCluster(clusterKey)}
                          onMouseLeave={() =>
                            setOpenCluster((k) => (k === clusterKey ? null : k))
                          }
                        >
                          <button
                            className={styles.overflowBadge}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenCluster((k) => (k === clusterKey ? null : clusterKey));
                            }}
                          >
                            {overflowIds.length}+
                          </button>

                          {openCluster === clusterKey && (
                            <div
                              className={styles.flyout}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className={styles.flyoutTitle}>{loc.name}</div>
                              {overflowIds.map((id) => {
                                const c = charactersById.get(id);
                                return (
                                  <button
                                    key={id}
                                    className={styles.flyoutRow}
                                    onClick={() => {
                                      setSelectedCharacterId(id);
                                      setOpenCluster(null);
                                    }}
                                  >
                                    <Avatar characterId={id} name={c?.name ?? id} size={22} />
                                    <span>{c?.name ?? id}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {events.length > 0 && (
                    <div
                      className={styles.eventCluster}
                      onMouseEnter={() => events.length > 1 && setOpenCluster(eventClusterKey)}
                      onMouseLeave={() =>
                        setOpenCluster((k) => (k === eventClusterKey ? null : k))
                      }
                    >
                      <button
                        className={`${styles.eventIcon} ${
                          isCurrentEventChapter(events[0].chapterSlug) ? styles.eventPulse : ""
                        }`}
                        title={events[0].title}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (events.length > 1) {
                            setOpenCluster((k) => (k === eventClusterKey ? null : eventClusterKey));
                          } else {
                            router.push(`/chapters/${events[0].chapterSlug}`);
                          }
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={MAP_EVENT_TYPE_ICONS[events[0].type]} alt={events[0].type} />
                        {events.length > 1 && (
                          <span className={styles.eventCount}>{events.length}</span>
                        )}
                      </button>

                      {openCluster === eventClusterKey && events.length > 1 && (
                        <div
                          className={styles.flyout}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className={styles.flyoutTitle}>{loc.name}</div>
                          {events.map((ev) => (
                            <button
                              key={ev.id}
                              className={styles.flyoutRow}
                              onClick={() => router.push(`/chapters/${ev.chapterSlug}`)}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={MAP_EVENT_TYPE_ICONS[ev.type]} alt={ev.type} width={18} height={18} />
                              <span>{ev.title}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend / event filters */}
          <div className={styles.legend} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.legendTitle}>Events</div>
            {ALL_EVENT_TYPES.map((type) => (
              <label key={type} className={styles.legendRow}>
                <input
                  type="checkbox"
                  checked={activeEventTypes.has(type)}
                  onChange={() => toggleEventType(type)}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MAP_EVENT_TYPE_ICONS[type]} alt="" width={16} height={16} />
                {MAP_EVENT_TYPE_LABELS[type]}
              </label>
            ))}
          </div>

          {/* Selected character card */}
          {selectedCharacter && (
            <div className={styles.characterCard} onMouseDown={(e) => e.stopPropagation()}>
              <button
                className={styles.characterCardClose}
                onClick={() => setSelectedCharacterId(null)}
                aria-label="Deselect character"
              >
                ×
              </button>
              <Avatar characterId={selectedCharacter.id} name={selectedCharacter.name} size={44} />
              <div>
                <div className={styles.characterCardName}>{selectedCharacter.name}</div>
                <div className={styles.characterCardTitle}>{selectedCharacter.title}</div>
                <Link href={`/characters/${selectedCharacter.id}`} className={styles.characterCardLink}>
                  View character →
                </Link>
              </div>
            </div>
          )}

          {/* Zoom controls */}
          <div className={styles.zoomControls} onMouseDown={(e) => e.stopPropagation()}>
            <button onClick={() => zoomBy(1.3)} title="Zoom in">+</button>
            <button onClick={() => zoomBy(1 / 1.3)} title="Zoom out">-</button>
            <button
              onClick={() => {
                const kl = getMapLocation(DEFAULT_MAP_LOCATION);
                if (kl && naturalSize) {
                  centerOn(kl.xPct, kl.yPct, naturalSize.width, naturalSize.height, DEFAULT_MAP_FOCUS_SCALE);
                }
              }}
              title="Center on King's Landing"
            >
              KL
            </button>
          </div>
        </div>

        {/* Chapter slider */}
        <div className={styles.timeline}>
          <button
            className={styles.timelineArrow}
            onClick={() => jumpToChapter(chapterIndex - 1)}
            disabled={chapterIndex === 0}
            aria-label="Previous chapter"
          >
            ‹
          </button>

          <div className={styles.timelineSliderWrap}>
            <input
              type="range"
              min={0}
              max={chapters.length - 1}
              step={1}
              value={chapterIndex}
              onChange={(e) => jumpToChapter(Number(e.target.value))}
              className={styles.timelineSlider}
            />
            <div className={styles.timelineLabel}>{currentChapter?.title}</div>
          </div>

          <button
            className={styles.timelineArrow}
            onClick={() => jumpToChapter(chapterIndex + 1)}
            disabled={chapterIndex === chapters.length - 1}
            aria-label="Next chapter"
          >
            ›
          </button>
        </div>
      </div>

      {/* Chapter summary card */}
      {currentChapter && (
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <h3>{currentChapter.title}</h3>
            <Link href={`/chapters/${currentChapter.slug}`} className={styles.summaryLink}>
              Read chapter →
            </Link>
          </div>
          <p className={styles.summaryText}>{currentChapter.synopsis}</p>
          {charactersByLocation.size > 0 && (
            <div className={styles.summaryCharacters}>
              {Array.from(charactersByLocation.entries()).map(([location, ids]) => (
                <div key={location} className={styles.summaryLocationGroup}>
                  <span className={styles.summaryLocationName}>{location}</span>
                  <div className={styles.summaryAvatarRow}>
                    {ids.map((id) => {
                      const c = charactersById.get(id);
                      return (
                        <button
                          key={id}
                          className={styles.summaryAvatarButton}
                          title={c?.name ?? id}
                          onClick={() => setSelectedCharacterId(id)}
                        >
                          <Avatar characterId={id} name={c?.name ?? id} size={26} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
