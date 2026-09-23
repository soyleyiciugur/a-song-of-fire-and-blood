import geometry from "./region-geometry.json";
import worldGeometry from "./world-region-geometry.json";

export interface MapRegion {
  id: string;
  name: string;
  color: string;
  path: string;
  house?: string;
  sigil?: string;
  label?: { x: number; y: number; size: number };
}

// Native coordinates of the exact Known World artwork. Each path contains
// closed coastline/island rings, including the shared inland boundaries.
export const REGION_MAP_SIZE = { width: geometry.width, height: geometry.height };
export const MAP_REGIONS: MapRegion[] = [...geometry.regions, ...worldGeometry.regions];
