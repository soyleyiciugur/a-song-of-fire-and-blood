import geometry from "./region-geometry.json";

// Native coordinates of the exact Known World artwork. Each path contains
// closed coastline/island rings, including the shared inland boundaries.
export const REGION_MAP_SIZE = { width: geometry.width, height: geometry.height };
export const MAP_REGIONS = geometry.regions;
