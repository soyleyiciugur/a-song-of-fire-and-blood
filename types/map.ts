// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\types\map.ts
export type MapEventType = "battle" | "feast" | "tournament" | "wedding";

export interface MapEvent {
  id: string;
  title: string;
  type: MapEventType;
  /** Must match a `name` in data/map/locations.ts */
  location: string;
  /** Chapter slug this event belongs to — links out and drives the timeline. */
  chapterSlug: string;
  description: string;
}

export const MAP_EVENT_TYPE_LABELS: Record<MapEventType, string> = {
  battle: "Battles",
  feast: "Feasts",
  tournament: "Tournaments",
  wedding: "Weddings",
};

export const MAP_EVENT_TYPE_ICONS: Record<MapEventType, string> = {
  battle: "/images/map/icon-battle.svg",
  feast: "/images/map/icon-feast.svg",
  tournament: "/images/map/icon-tournament.svg",
  wedding: "/images/map/icon-wedding.svg",
};
