"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CLICK_DRAG_THRESHOLD = 5;

export interface Pan {
  x: number;
  y: number;
}

interface UseMapViewportOptions {
  minScale?: number;
  maxScale?: number;
  /** How strongly one wheel "tick" changes the scale. Lower = gentler. */
  zoomSensitivity?: number;
  /** Called whenever the user begins an interaction that should take manual control. */
  onManualInteractionStart?: () => void;
}

/**
 * Cursor-anchored pan & zoom for a large image inside a fixed-size viewport.
 *
 * Fixes the two problems the old map-locator implementation had:
 *  1. Zoom felt way too fast / twitchy on trackpads.
 *     -> deltaY is normalized across input devices (line/page vs pixel mode)
 *        and clamped, then converted to a smooth exponential factor instead
 *        of multiplying by a fixed 1.15/0.87 every single wheel tick.
 *  2. Zoom didn't stay anchored under the cursor.
 *     -> React's synthetic onWheel is registered as a *passive* listener,
 *        so event.preventDefault() silently fails and the browser scrolls
 *        the page underneath at the same time as we transform the map,
 *        which throws off the cursor-anchor math. We attach a native
 *        { passive: false } listener instead, so preventDefault actually
 *        works and nothing moves except our own transform.
 */
export function useMapViewport({
  minScale = 0.4,
  maxScale = 8,
  zoomSensitivity = 0.0022,
  onManualInteractionStart,
}: UseMapViewportOptions = {}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });

  const dragState = useRef({
    dragging: false,
    moved: false,
    startX: 0,
    startY: 0,
    panStartX: 0,
    panStartY: 0,
  });

  const zoomAt = useCallback(
    (cursorX: number, cursorY: number, zoomFactor: number) => {
      setScale((prevScale) => {
        const nextScale = Math.min(
          maxScale,
          Math.max(minScale, prevScale * zoomFactor)
        );

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
    [minScale, maxScale]
  );

  // Native, non-passive wheel listener — see doc comment above for why.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      onManualInteractionStart?.();

      const rect = viewport.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;

      // deltaMode: 0 = pixels (trackpads, most mice), 1 = lines, 2 = pages.
      let delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 16;
      else if (event.deltaMode === 2) delta *= rect.height;

      // Clamp so a single aggressive mouse-wheel notch can't jump too far,
      // then convert to a smooth, proportional exponential zoom factor.
      const clampedDelta = Math.max(-100, Math.min(100, delta));
      const zoomFactor = Math.exp(-clampedDelta * zoomSensitivity);

      zoomAt(cursorX, cursorY, zoomFactor);
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [onManualInteractionStart, zoomAt, zoomSensitivity]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      onManualInteractionStart?.();
      dragState.current = {
        dragging: true,
        moved: false,
        startX: event.clientX,
        startY: event.clientY,
        panStartX: pan.x,
        panStartY: pan.y,
      };
    },
    [onManualInteractionStart, pan]
  );

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragState.current.dragging) return;

    const dx = event.clientX - dragState.current.startX;
    const dy = event.clientY - dragState.current.startY;

    if (
      Math.abs(dx) > CLICK_DRAG_THRESHOLD ||
      Math.abs(dy) > CLICK_DRAG_THRESHOLD
    ) {
      dragState.current.moved = true;
    }

    if (dragState.current.moved) {
      setPan({
        x: dragState.current.panStartX + dx,
        y: dragState.current.panStartY + dy,
      });
    }
  }, []);

  const handleMouseUp = useCallback((_: React.MouseEvent | void) => {
    dragState.current.dragging = false;
  }, []);

  /** Was the mouse dragged during this press? Consumed once, then reset. */
  const consumeDragFlag = useCallback(() => {
    const moved = dragState.current.moved;
    dragState.current.moved = false;
    return moved;
  }, []);

  /** Center the viewport on a natural-image percentage point. */
  const centerOn = useCallback(
    (
      xPct: number,
      yPct: number,
      naturalWidth: number,
      naturalHeight: number,
      targetScale?: number
    ) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const rect = viewport.getBoundingClientRect();

      setScale((prevScale) => {
        const nextScale = targetScale ?? prevScale;
        const imgX = (xPct / 100) * naturalWidth;
        const imgY = (yPct / 100) * naturalHeight;

        setPan({
          x: rect.width / 2 - imgX * nextScale,
          y: rect.height / 2 - imgY * nextScale,
        });

        return nextScale;
      });
    },
    []
  );

  const zoomBy = useCallback(
    (factor: number) => {
      const viewport = viewportRef.current;
      const rect = viewport?.getBoundingClientRect();
      const cx = rect ? rect.width / 2 : 0;
      const cy = rect ? rect.height / 2 : 0;
      zoomAt(cx, cy, factor);
    },
    [zoomAt]
  );

  return {
    viewportRef,
    scale,
    setScale,
    pan,
    setPan,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    consumeDragFlag,
    centerOn,
    zoomBy,
  };
}
