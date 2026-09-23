"use client";

import { useEffect, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { MAP_REGIONS, REGION_MAP_SIZE } from "@/data/map/regions";
import styles from "./interactive-map.module.css";

export default function RegionOverlay() {
  const [hover, setHover] = useState<{ name: string; x: number; y: number; flipX: boolean; flipY: boolean } | null>(null);

  useEffect(() => {
    const dismiss = () => setHover(null);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") dismiss(); };
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("wheel", dismiss, { passive: true });
    window.addEventListener("pointerdown", dismiss, true);
    window.addEventListener("resize", dismiss);
    window.addEventListener("blur", dismiss);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("wheel", dismiss);
      window.removeEventListener("pointerdown", dismiss, true);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("blur", dismiss);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const showName = (event: PointerEvent<SVGPathElement>, name: string) => {
    if (event.pointerType === "touch" || event.buttons || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      setHover(null);
      return;
    }
    const flipX = event.clientX > window.innerWidth / 2;
    const flipY = event.clientY > window.innerHeight - 80;
    setHover({ name, x: event.clientX + (flipX ? -14 : 14), y: event.clientY + (flipY ? -14 : 18), flipX, flipY });
  };

  return (
    <>
    <svg
      className={styles.regionOverlay}
      viewBox={`0 0 ${REGION_MAP_SIZE.width} ${REGION_MAP_SIZE.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      data-map-regions=""
    >
      {MAP_REGIONS.map((region) => (
        <path
          key={region.id}
          data-region={region.id}
          className={styles.regionBoundary}
          d={region.path}
          fill={region.color}
          fillRule="evenodd"
          stroke={region.color}
          style={{ color: region.color }}
          onPointerEnter={(event) => showName(event, region.name)}
          onPointerMove={(event) => showName(event, region.name)}
          onPointerLeave={() => setHover(null)}
          onPointerCancel={() => setHover(null)}
        />
      ))}
      {MAP_REGIONS.map((region) => region.sigil && region.label ? (
        <image
          key={region.id}
          data-region-sigil={region.house}
          className={styles.regionSigil}
          href={region.sigil}
          x={region.label.x - region.label.size / 2}
          y={region.label.y - region.label.size / 2}
          width={region.label.size}
          height={region.label.size}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : null)}
    </svg>
    {hover && createPortal(
      <div
        className={styles.regionNameTooltip}
        role="tooltip"
        style={{ left: hover.x, top: hover.y, transform: `translate(${hover.flipX ? "-100%" : "0"}, ${hover.flipY ? "-100%" : "0"})` }}
      >
        {hover.name}
      </div>,
      document.body,
    )}
    </>
  );
}
