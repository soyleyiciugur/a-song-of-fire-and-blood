"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./pullToRefresh.module.css";

const TRIGGER_DISTANCE = 62;
const MAX_DISTANCE = 96;

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function isBlockedTarget(target: EventTarget | null) {
  const element = target instanceof Element ? target : null;
  if (!element) return false;

  return Boolean(element.closest([
    "input",
    "textarea",
    "select",
    "[contenteditable='true']",
    "[role='dialog']",
    "[data-no-pull-refresh]",
    "canvas",
    ".maplibregl-map",
    ".mapboxgl-map",
    ".leaflet-container",
    "[data-map-interactive]",
    "[data-carousel]",
    "[data-slider]",
  ].join(",")));
}

function hasScrollableAncestor(target: EventTarget | null) {
  let element = target instanceof HTMLElement ? target : null;

  while (element && element !== document.body && element !== document.documentElement) {
    const style = getComputedStyle(element);
    const scrollable = /(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 2;
    if (scrollable) return true;
    element = element.parentElement;
  }

  return false;
}

export default function PullToRefresh() {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);
  const distanceRef = useRef(0);

  useEffect(() => {
    // Native browser pull-to-refresh is preferable outside the installed app.
    if (!isStandalone()) return;

    const reset = () => {
      startY.current = null;
      active.current = false;
      distanceRef.current = 0;
      setDistance(0);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (
        refreshing
        || event.touches.length !== 1
        || window.scrollY > 0
        || isBlockedTarget(event.target)
        || hasScrollableAncestor(event.target)
      ) return;

      startY.current = event.touches[0].clientY;
      active.current = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!active.current || startY.current === null || event.touches.length !== 1) return;

      if (window.scrollY > 0 || isBlockedTarget(event.target)) {
        reset();
        return;
      }

      const raw = event.touches[0].clientY - startY.current;
      if (raw <= 0) {
        distanceRef.current = 0;
        setDistance(0);
        return;
      }

      // Resist the gesture so the page feels anchored rather than rubber-banded.
      const resisted = Math.min(MAX_DISTANCE, raw * 0.48);
      distanceRef.current = resisted;
      setDistance(resisted);

      if (raw > 7 && event.cancelable) event.preventDefault();
    };

    const onTouchEnd = async () => {
      if (!active.current) return;

      const shouldRefresh = distanceRef.current >= TRIGGER_DISTANCE;
      startY.current = null;
      active.current = false;

      if (!shouldRefresh) {
        distanceRef.current = 0;
        setDistance(0);
        return;
      }

      setRefreshing(true);
      distanceRef.current = TRIGGER_DISTANCE;
      setDistance(TRIGGER_DISTANCE);

      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          await registration?.update().catch(() => undefined);
        }
      } finally {
        // A real reload refreshes every page and picks up new deployed assets.
        window.setTimeout(() => window.location.reload(), 180);
      }
    };

    const onTouchCancel = () => reset();

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [refreshing]);

  if (distance <= 0 && !refreshing) return null;

  const ready = distance >= TRIGGER_DISTANCE;

  return <div
    className={`${styles.indicator} ${ready ? styles.ready : ""} ${refreshing ? styles.refreshing : ""}`}
    style={{ opacity: Math.min(1, Math.max(.25, distance / TRIGGER_DISTANCE)) }}
    role="status"
    aria-live="polite"
  >
    <span aria-hidden="true">{refreshing ? "✦" : "↓"}</span>
    <b>{refreshing ? "Gathering fresh ravens…" : ready ? "Release to refresh" : "Pull to refresh"}</b>
  </div>;
}
