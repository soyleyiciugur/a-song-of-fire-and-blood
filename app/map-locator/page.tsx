// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\map-locator\page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useMapViewport } from "@/lib/useMapViewport";
import { MAP_LOCATIONS } from "@/data/map/locations";

import styles from "./map-locator.module.css";

const MAP_SRC = "/images/map/known-world.webp";
const STORAGE_KEY = "map-locator-points";

// Where the real /map page opens by default — kept in sync so this tool
// always previews the same default framing.
const KINGS_LANDING = MAP_LOCATIONS.find((l) => l.name === "King's Landing")!;
const DEFAULT_FOCUS_SCALE = 1;

interface MapPoint {
  id: string;
  name: string;
  xPct: number;
  yPct: number;
}

interface PendingPoint {
  xPct: number;
  yPct: number;
  left: number;
  top: number;
}

export default function MapLocatorPage() {
  const imgRef = useRef<HTMLImageElement>(null);

  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const {
    viewportRef,
    scale,
    setScale,
    pan,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    consumeDragFlag,
    centerOn,
  } = useMapViewport({ minScale: 0.15, maxScale: 8 });

  const [points, setPoints] = useState<MapPoint[]>(() => {
    if (typeof window === "undefined") return [];

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  });
  const [pending, setPending] = useState<PendingPoint | null>(null);
  const [pendingName, setPendingName] = useState("");
  const [copied, setCopied] = useState(false);

  // Persist points whenever they change.
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
  }, [points]);

  const fitToViewport = useCallback(
    (width: number, height: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const rect = viewport.getBoundingClientRect();
      const fitScale = Math.min(rect.width / width, rect.height / height) * 0.98;
      setScale(fitScale);
      centerOn(50, 50, width, height, fitScale);
    },
    [viewportRef, setScale, centerOn]
  );

  const centerOnKingsLanding = useCallback(
    (width?: number, height?: number) => {
      const w = width ?? naturalSize?.width;
      const h = height ?? naturalSize?.height;
      if (!w || !h) return;
      centerOn(KINGS_LANDING.xPct, KINGS_LANDING.yPct, w, h, DEFAULT_FOCUS_SCALE);
    },
    [centerOn, naturalSize]
  );

  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    const width = img.naturalWidth;
    const height = img.naturalHeight;
    setNaturalSize({ width, height });

    // Default view: zoomed in on King's Landing, same as the real map page.
    centerOn(KINGS_LANDING.xPct, KINGS_LANDING.yPct, width, height, DEFAULT_FOCUS_SCALE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageClick = useCallback(
    (event: React.MouseEvent) => {
      // A drag ending shouldn't drop a pin.
      if (consumeDragFlag()) return;

      const img = imgRef.current;
      if (!img) return;

      const rect = img.getBoundingClientRect();
      const xPct = ((event.clientX - rect.left) / rect.width) * 100;
      const yPct = ((event.clientY - rect.top) / rect.height) * 100;

      setPending({
        xPct,
        yPct,
        left: event.clientX - rect.left,
        top: event.clientY - rect.top,
      });
      setPendingName("");
    },
    [consumeDragFlag]
  );

  const confirmPending = useCallback(() => {
    if (!pending || !pendingName.trim()) return;

    setPoints((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: pendingName.trim(),
        xPct: pending.xPct,
        yPct: pending.yPct,
      },
    ]);

    setPending(null);
    setPendingName("");
  }, [pending, pendingName]);

  const cancelPending = useCallback(() => {
    setPending(null);
    setPendingName("");
  }, []);

  const removePoint = useCallback((id: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const renamePoint = useCallback(
    (id: string) => {
      const current = points.find((p) => p.id === id);
      if (!current) return;

      const next = window.prompt("Rename location", current.name);
      if (!next || !next.trim()) return;

      setPoints((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: next.trim() } : p))
      );
    },
    [points]
  );

  const clearAll = useCallback(() => {
    if (points.length === 0) return;
    if (!window.confirm(`Delete all ${points.length} logged points?`)) return;
    setPoints([]);
  }, [points]);

  const copyJson = useCallback(async () => {
    const payload = points.map(({ name, xPct, yPct }) => ({
      name,
      xPct: Math.round(xPct * 100) / 100,
      yPct: Math.round(yPct * 100) / 100,
    }));

    const json = JSON.stringify(payload, null, 2);

    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy the JSON below:", json);
    }
  }, [points]);

  const resetView = useCallback(() => {
    if (naturalSize) fitToViewport(naturalSize.width, naturalSize.height);
  }, [naturalSize, fitToViewport]);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Map Locator</h1>
        <p className={styles.subheading}>
          Scroll to zoom (anchored on your cursor), drag to pan, click to
          drop a pin and name a location. Points are saved in your browser
          and you can copy them out as JSON when you&apos;re done.
        </p>
      </div>

      <div className={styles.layout}>
        <div
          ref={viewportRef}
          className={styles.viewport}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
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
              ref={imgRef}
              src={MAP_SRC}
              alt="The Known World"
              className={styles.mapImage}
              draggable={false}
              onLoad={handleImageLoad}
              onClick={handleImageClick}
            />

            {points.map((point, index) => (
              <div
                key={point.id}
                className={styles.pin}
                style={{ left: `${point.xPct}%`, top: `${point.yPct}%` }}
                title={point.name}
              >
                <span className={styles.pinDot} />
                <span className={styles.pinIndex}>{index + 1}</span>
              </div>
            ))}
          </div>

          {pending && (
            <div
              className={styles.pendingForm}
              style={{
                left: pending.left,
                top: pending.top,
              }}
            >
              <input
                autoFocus
                className={styles.pendingInput}
                placeholder="Location name"
                value={pendingName}
                onChange={(e) => setPendingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmPending();
                  if (e.key === "Escape") cancelPending();
                }}
              />
              <div className={styles.pendingActions}>
                <button type="button" className={styles.pendingConfirm} onClick={confirmPending}>
                  Add
                </button>
                <button type="button" className={styles.pendingCancel} onClick={cancelPending}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className={styles.zoomControls}>
            <button type="button" onClick={() => centerOnKingsLanding()} title="Center on King's Landing">
              KL
            </button>
            <button type="button" onClick={() => setScale((s) => Math.min(8, s * 1.25))}>+</button>
            <button type="button" onClick={() => setScale((s) => Math.max(0.15, s / 1.25))}>-</button>
            <button type="button" onClick={resetView}>Fit</button>
          </div>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>
              Logged points ({points.length})
            </h2>
          </div>

          <ul className={styles.pointList}>
            {points.map((point, index) => (
              <li key={point.id} className={styles.pointItem}>
                <span className={styles.pointIndex}>{index + 1}</span>
                <button
                  className={styles.pointName}
                  onClick={() => renamePoint(point.id)}
                  title="Click to rename"
                >
                  {point.name}
                </button>
                <span className={styles.pointCoords}>
                  {point.xPct.toFixed(1)}%, {point.yPct.toFixed(1)}%
                </span>
                <button
                  className={styles.pointRemove}
                  onClick={() => removePoint(point.id)}
                  aria-label={`Remove ${point.name}`}
                >
                  ×
                </button>
              </li>
            ))}

            {points.length === 0 && (
              <li className={styles.pointEmpty}>
                No points yet — click anywhere on the map.
              </li>
            )}
          </ul>

          <div className={styles.sidebarActions}>
            <button className={styles.copyButton} onClick={copyJson}>
              {copied ? "Copied!" : "Copy JSON"}
            </button>
            <button className={styles.clearButton} onClick={clearAll}>
              Clear all
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
