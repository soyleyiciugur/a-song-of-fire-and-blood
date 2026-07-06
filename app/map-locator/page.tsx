"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./map-locator.module.css";

const MAP_SRC = "/images/map/known-world.webp";
const STORAGE_KEY = "map-locator-points";
const CLICK_DRAG_THRESHOLD = 5;

interface MapPoint {
  id: string;
  name: string;
  xPct: number;
  yPct: number;
}

interface PendingPoint {
  xPct: number;
  yPct: number;
  screenX: number;
  screenY: number;
}

export default function MapLocatorPage() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const [points, setPoints] = useState<MapPoint[]>([]);
  const [pending, setPending] = useState<PendingPoint | null>(null);
  const [pendingName, setPendingName] = useState("");
  const [copied, setCopied] = useState(false);

  const dragState = useRef<{
    dragging: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    panStartX: number;
    panStartY: number;
  }>({
    dragging: false,
    moved: false,
    startX: 0,
    startY: 0,
    panStartX: 0,
    panStartY: 0,
  });

  // Load persisted points.
  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setPoints(JSON.parse(raw));
      } catch {
        // ignore corrupted storage
      }
    }
  }, []);

  // Persist points whenever they change.
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
  }, [points]);

  // Fit the map to the viewport once we know its natural size.
  const fitToViewport = useCallback((width: number, height: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    const fitScale = Math.min(rect.width / width, rect.height / height) * 0.98;

    setScale(fitScale);
    setPan({
      x: (rect.width - width * fitScale) / 2,
      y: (rect.height - height * fitScale) / 2,
    });
  }, []);

  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    const width = img.naturalWidth;
    const height = img.naturalHeight;
    setNaturalSize({ width, height });
    fitToViewport(width, height);
  }, [fitToViewport]);

  // Zoom, keeping the point under the cursor fixed on screen.
  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();
      const viewport = viewportRef.current;
      if (!viewport) return;

      const rect = viewport.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;

      const zoomFactor = event.deltaY < 0 ? 1.15 : 1 / 1.15;

      setScale((prevScale) => {
        const nextScale = Math.min(8, Math.max(0.15, prevScale * zoomFactor));

        setPan((prevPan) => {
          const mapX = (cursorX - prevPan.x) / prevScale;
          const mapY = (cursorY - prevPan.y) / prevScale;

          return {
            x: cursorX - mapX * nextScale,
            y: cursorY - mapY * nextScale,
          };
        });

        return nextScale;
      });
    },
    []
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      dragState.current = {
        dragging: true,
        moved: false,
        startX: event.clientX,
        startY: event.clientY,
        panStartX: pan.x,
        panStartY: pan.y,
      };
    },
    [pan]
  );

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragState.current.dragging) return;

    const dx = event.clientX - dragState.current.startX;
    const dy = event.clientY - dragState.current.startY;

    if (Math.abs(dx) > CLICK_DRAG_THRESHOLD || Math.abs(dy) > CLICK_DRAG_THRESHOLD) {
      dragState.current.moved = true;
    }

    if (dragState.current.moved) {
      setPan({
        x: dragState.current.panStartX + dx,
        y: dragState.current.panStartY + dy,
      });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    dragState.current.dragging = false;
  }, []);

  const handleImageClick = useCallback((event: React.MouseEvent) => {
    // A drag ending shouldn't drop a pin.
    if (dragState.current.moved) {
      dragState.current.moved = false;
      return;
    }

    const img = imgRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const xPct = ((event.clientX - rect.left) / rect.width) * 100;
    const yPct = ((event.clientY - rect.top) / rect.height) * 100;

    setPending({
      xPct,
      yPct,
      screenX: event.clientX,
      screenY: event.clientY,
    });
    setPendingName("");
  }, []);

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

  const renamePoint = useCallback((id: string) => {
    const current = points.find((p) => p.id === id);
    if (!current) return;

    const next = window.prompt("Rename location", current.name);
    if (!next || !next.trim()) return;

    setPoints((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: next.trim() } : p))
    );
  }, [points]);

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
          Scroll to zoom, drag to pan, click to drop a pin and name a
          location. Points are saved in your browser and you can copy them
          out as JSON when you&apos;re done.
        </p>
      </div>

      <div className={styles.layout}>
        <div
          ref={viewportRef}
          className={styles.viewport}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            ref={wrapperRef}
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
                left: pending.screenX - (viewportRef.current?.getBoundingClientRect().left ?? 0),
                top: pending.screenY - (viewportRef.current?.getBoundingClientRect().top ?? 0),
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
                <button className={styles.pendingConfirm} onClick={confirmPending}>
                  Add
                </button>
                <button className={styles.pendingCancel} onClick={cancelPending}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className={styles.zoomControls}>
            <button onClick={() => setScale((s) => Math.min(8, s * 1.25))}>+</button>
            <button onClick={() => setScale((s) => Math.max(0.15, s / 1.25))}>-</button>
            <button onClick={resetView}>Fit</button>
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
