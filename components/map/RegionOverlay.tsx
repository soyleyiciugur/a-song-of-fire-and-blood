import { MAP_REGIONS, REGION_MAP_SIZE } from "@/data/map/regions";
import styles from "./interactive-map.module.css";

export default function RegionOverlay() {
  return (
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
        />
      ))}
      {MAP_REGIONS.map((region) => (
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
      ))}
    </svg>
  );
}
