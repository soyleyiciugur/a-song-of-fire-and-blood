// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\types\map.ts
export type MapEventType = "battle" | "feast" | "tournament" | "wedding" | "trial";

export interface MapEvent {
  id: string;
  title: string;
  type: MapEventType;
  location: string;
  chapterSlug: string;
  description: string;
}

export const MAP_EVENT_TYPE_LABELS: Record<MapEventType, string> = {
  battle: "Battles",
  feast: "Feasts",
  tournament: "Tournaments",
  wedding: "Weddings",
  trial: "Trials",
};

export const MAP_EVENT_TYPE_ICONS: Record<MapEventType, string> = {
  battle: "/images/map/icon-battle.svg",
  feast: "/images/map/icon-feast.svg",
  tournament: "/images/map/icon-tournament.svg",
  wedding: "/images/map/icon-wedding.svg",
  trial: "/images/map/icon-trial.svg",
};