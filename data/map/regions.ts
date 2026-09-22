export interface MapRegion {
  id: string;
  name: string;
  rulingHouse: string;
  color: string;
  /** SVG path in the same 0-100 coordinate space as the Known World image. */
  path: string;
}

/**
 * Westerosi regional outlines traced against public/images/map/known-world.webp.
 * Keeping the geometry in image coordinates lets the overlay share the map's
 * pan, zoom, and responsive transforms without viewport-specific positioning.
 */
export const MAP_REGIONS: MapRegion[] = [
  {
    id: "the-north",
    name: "The North",
    rulingHouse: "House Stark",
    color: "#666A70",
    path: "M 8.55 1.15 L 15.9 .1 18.15 1.65 19.25 6.3 20.75 8.2 20.2 11.1 22.2 13.7 22.8 18.6 24 22.3 22.55 27.3 21.1 30.2 20.45 33.9 18.55 34.35 17.1 33.15 15.05 34.05 13.3 33.2 11.3 34.15 9.1 32.9 7.65 34.2 6.9 31.8 7.75 28.6 8.15 24.4 7.15 21.2 7.55 17.5 8.5 14.2 7.15 10.7 8.35 7.3 Z",
  },
  {
    id: "iron-islands",
    name: "The Iron Islands",
    rulingHouse: "House Greyjoy",
    color: "#1C1C1C",
    path: "M 7.35 38.15 L 8.25 37.35 8.75 39.05 8.05 40.55 Z M 8.7 40.25 L 9.6 40.05 9.85 42.05 8.95 43.15 8.35 42.2 Z M 9.15 43.15 L 9.85 43.2 9.7 45.25 8.8 45.65 8.45 44.25 Z M 6.85 42.15 L 7.55 41.75 7.85 43.45 7.25 44.2 6.55 43.45 Z",
  },
  {
    id: "the-riverlands",
    name: "The Riverlands",
    rulingHouse: "House Tully",
    color: "#315D9B",
    path: "M 11.3 34.15 L 13.3 33.2 15.05 34.05 17.1 33.15 18.55 34.35 19.3 37.25 18.85 40.05 19.55 42.4 18.75 45.5 17.35 47.25 15.6 47.05 14.45 45.65 12.4 45.9 10.9 44.6 10.25 42.05 10.35 39.2 Z",
  },
  {
    id: "the-vale",
    name: "The Vale",
    rulingHouse: "House Arryn",
    color: "#4A90C2",
    path: "M 18.55 34.35 L 20.45 33.9 22.05 34.85 23.15 36.7 24.85 38.25 24.25 41.5 25.15 43.7 23.85 46.15 22.2 46.65 20.35 45.25 18.75 45.5 19.55 42.4 18.85 40.05 19.3 37.25 Z",
  },
  {
    id: "the-westerlands",
    name: "The Westerlands",
    rulingHouse: "House Lannister",
    color: "#86090A",
    path: "M 10.25 42.05 L 10.9 44.6 12.4 45.9 14.45 45.65 15.6 47.05 15.25 50.55 14.1 53.3 12.6 55.15 10.45 54.8 8.45 55.95 7.6 53.35 8.45 50.2 8.1 47.3 9.45 45.4 Z",
  },
  {
    id: "the-crownlands",
    name: "The Crownlands",
    rulingHouse: "House Targaryen",
    color: "#B22222",
    path: "M 15.6 47.05 L 17.35 47.25 18.75 45.5 20.35 45.25 22.2 46.65 23.85 46.15 23.45 49.2 22.2 51.25 22.6 53.15 21.15 55.25 19.4 54.65 17.55 55.2 16.4 53.25 15.25 50.55 Z M 22.75 46.25 L 24.1 46.55 24.45 48.25 23.2 49.05 Z",
  },
  {
    id: "the-reach",
    name: "The Reach",
    rulingHouse: "House Tyrell",
    color: "#228B22",
    path: "M 8.45 55.95 L 10.45 54.8 12.6 55.15 14.1 53.3 15.25 50.55 16.4 53.25 17.55 55.2 19.4 54.65 20.05 57.35 18.65 59.55 17.15 61.15 15.2 62.15 13.4 64.5 11.25 65.45 8.75 64.2 7.25 62.35 7.75 59.1 Z",
  },
  {
    id: "the-stormlands",
    name: "The Stormlands",
    rulingHouse: "House Baratheon",
    color: "#F3CE1B",
    path: "M 19.4 54.65 L 21.15 55.25 22.6 53.15 23.4 55.15 24.8 57.05 24.25 59.65 22.7 61.2 20.9 61.65 19.55 63.35 17.15 61.15 18.65 59.55 20.05 57.35 Z",
  },
  {
    id: "dorne",
    name: "Dorne",
    rulingHouse: "House Martell",
    color: "#D97925",
    path: "M 7.25 62.35 L 8.75 64.2 11.25 65.45 13.4 64.5 15.2 62.15 17.15 61.15 19.55 63.35 20.9 61.65 22.7 61.2 24.25 59.65 24.95 62.1 24.25 65.3 22.7 67.15 20.2 68.15 17.55 68.75 14.8 68.45 12.2 69 9.65 68.05 7.65 66.2 Z",
  },
];
