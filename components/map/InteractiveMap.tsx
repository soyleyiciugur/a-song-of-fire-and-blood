"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const MIN_MARKER_DISTANCE_PX = 46;

const CENTER_IN_MS = 100;
const HOP_MS = 1500;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const ROMAN_VALUES: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
};

type LocationEntry = { id: string; faded: boolean };
type DeclutteredLocation = (typeof MAP_LOCATIONS)[number] & {
  offsetXPct: number;
  offsetYPct: number;
};

const FADED_AVATAR_SIZE = 26;
const NORMAL_AVATAR_SIZE = 36;

function romanFromTitle(title: string): number {
  const match = title.match(/Chapter\s+([IVXLC]+)/i);
  if (!match) return 999;
  return ROMAN_VALUES[match[1].toUpperCase()] ?? 999;
}

function interpolateHexColor(startHex: string, endHex: string, ratio: number): string {
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  const toRgb = (hex: string) => {
    const normalized = hex.replace("#", "");
    const value = normalized.length === 3
      ? normalized.split("").map((char) => `${char}${char}`).join("")
      : normalized;
    const intValue = Number.parseInt(value, 16);
    return {
      r: (intValue >> 16) & 255,
      g: (intValue >> 8) & 255,
      b: intValue & 255,
    };
  };
  const from = toRgb(startHex);
  const to = toRgb(endHex);
  const t = clamp(ratio);
  const r = Math.round(from.r + (to.r - from.r) * t);
  const g = Math.round(from.g + (to.g - from.g) * t);
  const b = Math.round(from.b + (to.b - from.b) * t);
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function getTrailColorAtRatio(ratio: number): string {
  const clamped = Math.min(1, Math.max(0, ratio));
  const stops = [
    { ratio: 0, color: "#f2d98a" },
    { ratio: 0.5, color: "#c9a227" },
    { ratio: 1, color: "#8a1f1f" },
  ];

  if (clamped <= 0) return stops[0].color;
  if (clamped >= 1) return stops[stops.length - 1].color;

  for (let i = 1; i < stops.length; i += 1) {
    const prev = stops[i - 1];
    const next = stops[i];
    if (clamped <= next.ratio) {
      const localRatio = (clamped - prev.ratio) / (next.ratio - prev.ratio);
      return interpolateHexColor(prev.color, next.color, localRatio);
    }
  }

  return stops[stops.length - 1].color;
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
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [characterId]);

  const src = hasError ? MINI_FALLBACK : `/images/miniportraits/${characterId}.webp`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      draggable={false}
      onError={() => setHasError(true)}
      className={styles.avatarImg}
      style={{ width: size, height: size }}
    />
  );
}

export default function InteractiveMap() {
  const router = useRouter();

  const [visibleCard, setVisibleCard] = useState<Character | null>(null);
  const [cardVisible, setCardVisible] = useState(false);

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
  const [lockedCluster, setLockedCluster] = useState<string | null>(null);

  const [activeEventTypes, setActiveEventTypes] = useState<Set<MapEventType>>(
    new Set(ALL_EVENT_TYPES)
  );

  const [travelPos, setTravelPos] = useState<{ xPct: number; yPct: number } | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const followRafRef = useRef<number | null>(null);
  const followGenerationRef = useRef(0);
  const isDraggingRef = useRef(false);
  const manualControlRef = useRef(false);

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
  } = useMapViewport({
    minScale: 0.2,
    maxScale: 8,
    onManualInteractionStart: () => {
      manualControlRef.current = true;
    },
  });

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

  const charactersByLocation = useMemo(() => {
    const map = new Map<string, LocationEntry[]>();
    Object.entries(currentPositions).forEach(([charId, location]) => {
      if (!location) return;
      const locs = Array.isArray(location) ? location : [location];
      locs.forEach((locName, idx) => {
        const isLast = idx === locs.length - 1;
        const faded = locs.length > 1 && !isLast;
        const list = map.get(locName) ?? [];
        list.push({ id: charId, faded });
        map.set(locName, list);
      });
    });
    map.forEach((list, key) => {
      list.sort((a, b) => {
        const ca = charactersById.get(a.id);
        const cb = charactersById.get(b.id);
        return getTitleRank(ca?.title ?? "") - getTitleRank(cb?.title ?? "");
      });
      map.set(key, list);
    });
    return map;
  }, [currentPositions, charactersById]);

  const visibleEventsByLocation = useMemo(() => {
    const map = new Map<string, typeof MAP_EVENTS>();
    const currentSlug = chapters[chapterIndex]?.slug;
    if (!currentSlug) return map;

    MAP_EVENTS.forEach((event) => {
      if (!activeEventTypes.has(event.type)) return;

      const eventChapterSlugs =
        (event as { chapterSlugs?: string[] }).chapterSlugs ?? [event.chapterSlug];

      if (!eventChapterSlugs.includes(currentSlug)) return;

      const list = map.get(event.location) ?? [];
      list.push(event);
      map.set(event.location, list);
    });
    return map;
  }, [activeEventTypes, chapters, chapterIndex]);

  const fullTrailPoints = useMemo(() => {
    if (!selectedCharacterId) return [];

    const points: {
      xPct: number;
      yPct: number;
      chapterIdx: number;
      roman: string;
      locationName: string;
    }[] = [];

    for (let i = 0; i <= chapterIndex; i++) {
      const chapter = chapters[i];
      if (!chapter) continue;

      const positions = getCharacterPositionsForChapter(chapter.slug);
      const location = positions[selectedCharacterId as keyof typeof positions];
      if (!location) continue;

      const locs = Array.isArray(location) ? location : [location];
      const romanMatch = chapter.title.match(/Chapter\s+([IVXLC]+)/i);
      const roman = romanMatch ? romanMatch[1] : String(i + 1);

      locs.forEach((locName) => {
        const coords = getMapLocation(locName);
        if (!coords) return;

        const last = points[points.length - 1];
        if (last && last.xPct === coords.xPct && last.yPct === coords.yPct) return;

        points.push({
          xPct: coords.xPct,
          yPct: coords.yPct,
          chapterIdx: i,
          roman,
          locationName: locName,
        });
      });
    }

    return points;
  }, [selectedCharacterId, chapters, chapterIndex]);

  const trailPathD = useMemo(() => {
    if (!naturalSize || fullTrailPoints.length < 2) return "";

    return fullTrailPoints
      .map((p, i) => {
        const x = (p.xPct / 100) * naturalSize.width;
        const y = (p.yPct / 100) * naturalSize.height;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [fullTrailPoints, naturalSize]);

  const trailSegments = useMemo(() => {
    if (!naturalSize || fullTrailPoints.length < 2) return [];

    const pointsPx = fullTrailPoints.map((point) => ({
      x: (point.xPct / 100) * naturalSize.width,
      y: (point.yPct / 100) * naturalSize.height,
    }));

    let totalDistance = 0;
    for (let i = 1; i < pointsPx.length; i += 1) {
      const prev = pointsPx[i - 1];
      const next = pointsPx[i];
      totalDistance += Math.hypot(next.x - prev.x, next.y - prev.y);
    }

    let cumulativeDistance = 0;
    return pointsPx.slice(1).map((point, index) => {
      const startPoint = pointsPx[index];
      const endPoint = point;
      const lengthPx = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y);
      const startRatio = totalDistance > 0 ? cumulativeDistance / totalDistance : 0;
      cumulativeDistance += lengthPx;
      const endRatio = totalDistance > 0 ? cumulativeDistance / totalDistance : 0;

      return {
        id: `${index}-${startPoint.x.toFixed(1)}-${startPoint.y.toFixed(1)}`,
        d: `M ${startPoint.x.toFixed(1)},${startPoint.y.toFixed(1)} L ${endPoint.x.toFixed(1)},${endPoint.y.toFixed(1)}`,
        x1: startPoint.x,
        y1: startPoint.y,
        x2: endPoint.x,
        y2: endPoint.y,
        lengthPx,
        startRatio,
        endRatio,
        startColor: getTrailColorAtRatio(startRatio),
        endColor: getTrailColorAtRatio(endRatio),
      };
    });
  }, [fullTrailPoints, naturalSize]);

  const trailPathRef = useRef<SVGPathElement | null>(null);
  const trailPathLengthRef = useRef(0);
  const [trailProgress, setTrailProgress] = useState(0);

  useEffect(() => {
    if (trailPathRef.current) {
      const measuredLength = trailPathRef.current.getTotalLength();
      trailPathLengthRef.current = measuredLength;
    }
  }, [trailPathD]);

  const selectedCharacterCurrentLocation = useMemo(() => {
    if (!selectedCharacterId) return null;
    const location = currentPositions[selectedCharacterId as keyof typeof currentPositions];
    if (!location) return null;
    const locs = Array.isArray(location) ? location : [location];
    return getMapLocation(locs[locs.length - 1]);
  }, [selectedCharacterId, currentPositions]);

  const selectedCharacter = selectedCharacterId ? charactersById.get(selectedCharacterId) : null;

  useEffect(() => {
    if (selectedCharacter) {
      setCardVisible(false);
      const t = setTimeout(() => {
        setVisibleCard(selectedCharacter);
        setCardVisible(true);
      }, 180);
      return () => clearTimeout(t);
    } else {
      setCardVisible(false);
      const t = setTimeout(() => setVisibleCard(null), 180);
      return () => clearTimeout(t);
    }
  }, [selectedCharacter]);

  const cancelFollow = useCallback(() => {
    followGenerationRef.current += 1;
    if (followRafRef.current !== null) {
      cancelAnimationFrame(followRafRef.current);
      followRafRef.current = null;
    }
    setIsFollowing(false);
    setTrailProgress(0);
  }, []);

  useEffect(() => {
    const resolvedNaturalSize = naturalSize;

    if (
      !selectedCharacterId ||
      !resolvedNaturalSize ||
      fullTrailPoints.length === 0 ||
      !viewportRef.current ||
      !scale
    ) {
      cancelFollow();
      setTravelPos(null);
      return;
    }

    cancelFollow();
    const myGen = followGenerationRef.current + 1;
    followGenerationRef.current = myGen;
    manualControlRef.current = false;

    const rect = viewportRef.current.getBoundingClientRect();
    const lockedScale = scale;
    const naturalSizeForAnimation = resolvedNaturalSize;

    const startCenterPxX = (rect.width / 2 - pan.x) / lockedScale;
    const startCenterPxY = (rect.height / 2 - pan.y) / lockedScale;
    const startXPct = (startCenterPxX / naturalSizeForAnimation.width) * 100;
    const startYPct = (startCenterPxY / naturalSizeForAnimation.height) * 100;

    const target = fullTrailPoints[0];
    const hasPath = fullTrailPoints.length > 1;
    const pathDuration = hasPath ? (fullTrailPoints.length - 1) * HOP_MS : 0;

    setIsFollowing(true);
    setTravelPos({ xPct: startXPct, yPct: startYPct });
    setTrailProgress(0);

    const start = performance.now();

    function frame(now: number) {
      if (followGenerationRef.current !== myGen) return;

      const elapsed = now - start;
      const shouldFollowCamera = !manualControlRef.current && !isDraggingRef.current;

      if (elapsed <= CENTER_IN_MS) {
        const t = easeInOutCubic(Math.min(1, elapsed / CENTER_IN_MS));
        const xPct = startXPct + (target.xPct - startXPct) * t;
        const yPct = startYPct + (target.yPct - startYPct) * t;
        if (shouldFollowCamera) {
          centerOn(xPct, yPct, naturalSizeForAnimation.width, naturalSizeForAnimation.height, lockedScale);
        }
        setTravelPos({ xPct, yPct });
        setTrailProgress(0);
        followRafRef.current = requestAnimationFrame(frame);
        return;
      }

      if (!hasPath) {
        if (shouldFollowCamera) {
          centerOn(target.xPct, target.yPct, naturalSizeForAnimation.width, naturalSizeForAnimation.height, lockedScale);
        }
        setTravelPos({ xPct: target.xPct, yPct: target.yPct });
        setTrailProgress(1);
        setIsFollowing(false);
        return;
      }

      const pathEl = trailPathRef.current;
      let length = trailPathLengthRef.current;

      if (!pathEl) {
        followRafRef.current = requestAnimationFrame(frame);
        return;
      }

      if (length <= 0) {
        length = pathEl.getTotalLength();
        trailPathLengthRef.current = length;
      }

      if (length <= 0) {
        followRafRef.current = requestAnimationFrame(frame);
        return;
      }

      const pathElapsed = elapsed - CENTER_IN_MS;
      const pathT = Math.min(1, pathElapsed / pathDuration);
      const point = pathEl.getPointAtLength(pathT * length);
      const xPct = (point.x / naturalSizeForAnimation.width) * 100;
      const yPct = (point.y / naturalSizeForAnimation.height) * 100;

      if (shouldFollowCamera) {
        centerOn(xPct, yPct, naturalSizeForAnimation.width, naturalSizeForAnimation.height, lockedScale);
      }
      setTravelPos({ xPct, yPct });
      setTrailProgress(pathT);

      if (pathT < 1) {
        followRafRef.current = requestAnimationFrame(frame);
      } else {
        setIsFollowing(false);
      }
    }

    followRafRef.current = requestAnimationFrame(frame);

    return () => {
      if (followRafRef.current !== null) {
        cancelAnimationFrame(followRafRef.current);
      }
    };
    
    // YANLIŞ OLANI DÜZELTTİĞİMİZ KISIM: 
    // We intentionally only restart this on character/chapter/natural-size
    // changes — not on every pan/scale change, since those are often
    // *caused* by this very effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCharacterId, chapterIndex, naturalSize]);

  useEffect(() => cancelFollow, [cancelFollow]);

  const handleViewportMouseDown = useCallback(
    (event: React.MouseEvent) => {
      isDraggingRef.current = true;
      manualControlRef.current = true;
      handleMouseDown(event);
    },
    [handleMouseDown]
  );

  const handleViewportMouseMove = useCallback(
    (event: React.MouseEvent) => {
      handleMouseMove(event);
    },
    [handleMouseMove]
  );

  const stopDragging = useCallback(
    () => {
      isDraggingRef.current = false;
      handleMouseUp();
    },
    [handleMouseUp]
  );

  const handleMapClick = useCallback(() => {
    if (consumeDragFlag()) return;
    setOpenCluster(null);
    setLockedCluster(null);
  }, [consumeDragFlag]);

  const toggleEventType = useCallback((type: MapEventType) => {
    setActiveEventTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const jumpToChapter = useCallback(
    (idx: number) => {
      setChapterIndex(Math.max(0, Math.min(chapters.length - 1, idx)));
    },
    [chapters.length]
  );

  const declutteredLocations = useMemo<DeclutteredLocation[]>(() => {
    if (!naturalSize) {
      return MAP_LOCATIONS.map((loc) => ({
        ...loc,
        offsetXPct: loc.xPct,
        offsetYPct: loc.yPct,
      }));
    }

    const visible = MAP_LOCATIONS.filter((loc) => {
      const hasChars = (charactersByLocation.get(loc.name)?.length ?? 0) > 0;
      const hasEvents = (visibleEventsByLocation.get(loc.name)?.length ?? 0) > 0;
      return hasChars || hasEvents;
    });

    const positioned = visible.map((loc) => ({
      ...loc,
      offsetXPct: loc.xPct,
      offsetYPct: loc.yPct,
    }));

    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < positioned.length; i++) {
        for (let j = i + 1; j < positioned.length; j++) {
          const a = positioned[i];
          const b = positioned[j];

          const axPx = (a.offsetXPct / 100) * naturalSize.width * scale;
          const ayPx = (a.offsetYPct / 100) * naturalSize.height * scale;
          const bxPx = (b.offsetXPct / 100) * naturalSize.width * scale;
          const byPx = (b.offsetYPct / 100) * naturalSize.height * scale;

          const dx = bxPx - axPx;
          const dy = byPx - ayPx;
          const dist = Math.hypot(dx, dy) || 0.0001;

          if (dist < MIN_MARKER_DISTANCE_PX) {
            const push = (MIN_MARKER_DISTANCE_PX - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;

            const pushXPct = ((nx * push) / (naturalSize.width * scale)) * 100;
            const pushYPct = ((ny * push) / (naturalSize.height * scale)) * 100;

            a.offsetXPct -= pushXPct;
            a.offsetYPct -= pushYPct;
            b.offsetXPct += pushXPct;
            b.offsetYPct += pushYPct;
          }
        }
      }
    }

    return positioned;
  }, [naturalSize, scale, charactersByLocation, visibleEventsByLocation]);

  return (
    <div className={styles.frameOuter}>
      <div className={styles.frameInner}>
        <div
          ref={viewportRef}
          className={styles.viewport}
          onMouseDown={handleViewportMouseDown}
          onMouseMove={handleViewportMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          onClick={handleMapClick}
        >
          <div
            className={styles.mapWrapper}
            style={
              {
                width: naturalSize?.width ?? "auto",
                height: naturalSize?.height ?? "auto",
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                "--map-zoom": scale,
              } as React.CSSProperties
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={MAP_SRC}
              alt="The Known World"
              className={styles.mapImage}
              draggable={false}
              onLoad={handleImageLoad}
            />

            {selectedCharacterId && naturalSize && fullTrailPoints.length > 1 && trailPathD && (
              <svg
                key={`trail-svg-${selectedCharacterId}-${chapterIndex}`}
                className={styles.trailSvg}
                viewBox={`0 0 ${naturalSize.width} ${naturalSize.height}`}
                preserveAspectRatio="none"
              >
                <defs>
                  {trailSegments.map((segment) => (
                    <linearGradient
                      key={`trail-gradient-${segment.id}`}
                      id={`trail-gradient-${segment.id}`}
                      gradientUnits="userSpaceOnUse"
                      x1={segment.x1}
                      y1={segment.y1}
                      x2={segment.x2}
                      y2={segment.y2}
                    >
                      <stop offset="0%" stopColor={segment.startColor} />
                      <stop offset="100%" stopColor={segment.endColor} />
                    </linearGradient>
                  ))}
                </defs>

                <path
                  ref={trailPathRef}
                  d={trailPathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={0}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                />

                {trailSegments.map((segment, index) => {
                  const span = Math.max(0.0001, segment.endRatio - segment.startRatio);
                  const visibleRatio = Math.min(
                    1,
                    Math.max(0, (trailProgress - segment.startRatio) / span)
                  );

                  return (
                    <path
                      key={`trail-segment-${selectedCharacterId}-${chapterIndex}-${index}`}
                      d={segment.d}
                      fill="none"
                      stroke={`url(#trail-gradient-${segment.id})`}
                      strokeWidth={Math.max(2, 3 / scale)}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={styles.trailPathDraw}
                      style={
                        {
                          "--path-length": segment.lengthPx,
                          strokeDasharray: `${segment.lengthPx} ${segment.lengthPx}`,
                          strokeDashoffset: segment.lengthPx * (1 - visibleRatio),
                          animation: "none",
                        } as React.CSSProperties
                      }
                    />
                  );
                })}
              </svg>
            )}

            {selectedCharacterId &&
              fullTrailPoints.map((p, idx) => {
                const isCurrentChapterStop = p.chapterIdx === chapterIndex;

                return (
                  <button
                    key={`ghost-${selectedCharacterId}-${chapterIndex}-${idx}`}
                    className={`${styles.ghostMarker} ${
                      isCurrentChapterStop ? styles.ghostMarkerActive : ""
                    }`}
                    style={
                      {
                        left: `${p.xPct}%`,
                        top: `${p.yPct}%`,
                        "--reveal-delay": `${CENTER_IN_MS + idx * 250}ms`,
                      } as React.CSSProperties
                    }
                    title={`${selectedCharacter?.name ?? ""} — Chapter ${p.roman}, ${p.locationName}`}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      jumpToChapter(p.chapterIdx);
                    }}
                  >
                    {selectedCharacter && (
                      <Avatar
                        characterId={selectedCharacter.id}
                        name={selectedCharacter.name}
                        size={idx === fullTrailPoints.length - 1 ? 30 : 24}
                      />
                    )}
                    <span className={styles.ghostRoman}>{p.roman}</span>
                  </button>
                );
              })}

            {isFollowing && travelPos && selectedCharacter && (
              <div
                key={`traveler-${selectedCharacterId}-${chapterIndex}`}
                className={styles.travelingAvatar}
                style={{
                  left: `${travelPos.xPct}%`,
                  top: `${travelPos.yPct}%`,
                }}
              >
                <Avatar characterId={selectedCharacter.id} name={selectedCharacter.name} size={34} />
              </div>
            )}

            {/* Location markers: characters + events */}
            {declutteredLocations.map((loc) => {
              const charEntries = charactersByLocation.get(loc.name) ?? [];
              const events = visibleEventsByLocation.get(loc.name) ?? [];
              if (charEntries.length === 0 && events.length === 0) return null;

              const visibleEntries = charEntries.slice(0, MAX_VISIBLE_AVATARS);
              const overflowEntries = charEntries.slice(MAX_VISIBLE_AVATARS);
              const clusterKey = `chars-${loc.name}`;
              const eventClusterKey = `events-${loc.name}`;

              const isCurrentEventChapter = (slug: string) =>
                chapters[chapterIndex]?.slug === slug;

              return (
                <div
                  key={loc.name}
                  className={styles.locationMarker}
                  style={{ left: `${loc.offsetXPct}%`, top: `${loc.offsetYPct}%` }}
                >
                  {charEntries.length > 0 && (
                    <div
                      className={styles.avatarRow}
                      onMouseEnter={() => {
                        if (overflowEntries.length > 0 && lockedCluster !== clusterKey) {
                          setOpenCluster(clusterKey);
                        }
                      }}
                      onMouseLeave={() => {
                        if (lockedCluster !== clusterKey) {
                          setOpenCluster((k) => (k === clusterKey ? null : k));
                        }
                      }}
                    >
                      {visibleEntries.map((entry) => {
                        const id = entry.id;
                        const c = charactersById.get(id);
                        const isSelected = id === selectedCharacterId;
                        const isPulsing =
                          isSelected &&
                          !entry.faded &&
                          selectedCharacterCurrentLocation?.name === loc.name;
                        return (
                          <button
                            key={id}
                            className={`${styles.avatarButton} ${isSelected ? styles.avatarSelected : ""} ${entry.faded ? styles.avatarFaded : ""}`}
                            title={entry.faded ? `${c?.name ?? id} (passing by)` : c?.name ?? id}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCharacterId(id === selectedCharacterId ? null : id);
                            }}
                          >
                            {isPulsing && <span className={styles.pulseRing} />}
                            <Avatar
                              characterId={id}
                              name={c?.name ?? id}
                              size={entry.faded ? FADED_AVATAR_SIZE : NORMAL_AVATAR_SIZE}
                            />
                          </button>
                        );
                      })}

                      {overflowEntries.length > 0 && (
                        <div className={styles.overflowWrap}>
                          <button
                            className={styles.overflowBadge}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (lockedCluster === clusterKey) {
                                setLockedCluster(null);
                                setOpenCluster(null);
                              } else {
                                setLockedCluster(clusterKey);
                                setOpenCluster(clusterKey);
                              }
                            }}
                          >
                            {overflowEntries.length}+
                          </button>
                        </div>
                      )}

                      {(openCluster === clusterKey || lockedCluster === clusterKey) && (
                        <div
                          className={styles.flyout}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className={styles.flyoutTitle}>{loc.name}</div>
                          {charEntries.map((entry) => {
                            const c = charactersById.get(entry.id);
                            return (
                              <button
                                key={entry.id}
                                className={styles.flyoutRow}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCharacterId(entry.id);
                                  setOpenCluster(null);
                                  setLockedCluster(null); 
                                }}
                              >
                                <Avatar characterId={entry.id} name={c?.name ?? entry.id} size={24} />
                                <span>
                                  {c?.name ?? entry.id}
                                  {entry.faded && (
                                    <span className={styles.flyoutFadedTag}> (passing by)</span>
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {events.length > 0 && (
                    <div
                      className={styles.eventCluster}
                      onMouseEnter={() => {
                        if (events.length > 1 && lockedCluster !== eventClusterKey) {
                          setOpenCluster(eventClusterKey);
                        }
                      }}
                      onMouseLeave={() => {
                        if (lockedCluster !== eventClusterKey) {
                          setOpenCluster((k) => (k === eventClusterKey ? null : k));
                        }
                      }}
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
                            if (lockedCluster === eventClusterKey) {
                              setLockedCluster(null);
                              setOpenCluster(null);
                            } else {
                              setLockedCluster(eventClusterKey);
                              setOpenCluster(eventClusterKey);
                            }
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

                      {(openCluster === eventClusterKey || lockedCluster === eventClusterKey) && events.length > 1 && (
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
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/chapters/${ev.chapterSlug}`);
                              }}
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
          {visibleCard && (
            <div
              className={styles.characterCard}
              style={{
                opacity: cardVisible ? 1 : 0,
                transform: cardVisible ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.96)",
                transition: "opacity 0.18s ease, transform 0.18s ease",
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                className={styles.characterCardClose}
                onClick={() => setSelectedCharacterId(null)}
                aria-label="Deselect character"
              >
                ×
              </button>
              <Avatar characterId={visibleCard.id} name={visibleCard.name} size={48} />
              <div>
                <div className={styles.characterCardName}>{visibleCard.name}</div>
                <div className={styles.characterCardTitle}>{visibleCard.title}</div>
                <Link href={`/characters/${visibleCard.id}`} className={styles.characterCardLink}>
                  View character →
                </Link>
              </div>
            </div>
          )}

          {/* Zoom controls */}
          <div className={styles.zoomControls} onMouseDown={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                manualControlRef.current = true;
                zoomBy(1.3);
              }}
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={() => {
                manualControlRef.current = true;
                zoomBy(1 / 1.3);
              }}
              title="Zoom out"
            >
              -
            </button>
            <button
              onClick={() => {
                manualControlRef.current = true;
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
        <div className={styles.timeline} onMouseDown={(e) => e.stopPropagation()}>
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
              {Array.from(charactersByLocation.entries()).map(([location, entries]) => (
                <div key={location} className={styles.summaryLocationGroup}>
                  <span className={styles.summaryLocationName}>{location}</span>
                  <div className={styles.summaryAvatarRow}>
                    {entries.map((entry) => {
                      const c = charactersById.get(entry.id);
                      return (
                        <button
                          key={entry.id}
                          className={`${styles.summaryAvatarButton} ${entry.faded ? styles.avatarFaded : ""}`}
                          title={entry.faded ? `${c?.name ?? entry.id} (passing by)` : c?.name ?? entry.id}
                          onClick={() => setSelectedCharacterId(entry.id)}
                        >
                          <Avatar
                            characterId={entry.id}
                            name={c?.name ?? entry.id}
                            size={entry.faded ? FADED_AVATAR_SIZE : 26}
                          />
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