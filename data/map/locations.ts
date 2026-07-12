// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\data\map\locations.ts
import locationsData from "./locations.json";

export interface MapLocation {
  name: string;
  xPct: number;
  yPct: number;
}

export const MAP_LOCATIONS: MapLocation[] = locationsData as MapLocation[];

export const MAP_LOCATION_NAMES = MAP_LOCATIONS.map((l) => l.name);

const locationIndex = new Map(MAP_LOCATIONS.map((l) => [l.name, l]));

export function getMapLocation(name: string): MapLocation | undefined {
  return locationIndex.get(name);
}

export const DEFAULT_MAP_LOCATION = "King's Landing";
export const DEFAULT_MAP_FOCUS_SCALE = 0.7;