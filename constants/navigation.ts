// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\constants\navigation.ts

export type NavigationItem = {
  label: string;
  href: string;
};

export type NavigationGroup = {
  label: string;
  href?: string; // <-- Added this so TypeScript knows groups can have links!
  items: NavigationItem[];
};

// A nav entry is either a plain link or a dropdown group
export type NavigationEntry = NavigationItem | NavigationGroup;

export function isNavigationGroup(entry: NavigationEntry): entry is NavigationGroup {
  return "items" in entry;
}

export const NAV_ITEMS: NavigationEntry[] = [
  { label: "Chapters", href: "/chapters" },
  { 
    label: "Characters", 
    href: "/characters", 
    items: [
      { label: "Family Tree", href: "/family-tree" },
      { label: "Relationships", href: "/relationships" },
    ],
  },
  { label: "Bestiary", href: "/bestiary", items: [
    { label: "Dragons", href: "/bestiary/dragons" },
    { label: "Direwolves", href: "/bestiary/direwolves" },
    { label: "Dogs", href: "/bestiary/dogs" },
    { label: "Cats", href: "/bestiary/cats" },
  ] },
  { label: "Houses", href: "/houses" },
  { label: "The Known World", href: "/map", items: [
    { label: "Map", href: "/map" },
    { label: "Locations", href: "/locations" },
  ] },
  { label: "The Chronicle", href: "/chronicle", items: [
    { label: "Timeline", href: "/timeline" },
    { label: "Annals", href: "/chronicle" },
    { label: "The Bloodshed", href: "/wars" },
  ] },
  { label: "Succession", href: "/succession" },
  { label: "The Collection", href: "/collection", items: [
    { label: "Artifacts", href: "/collection" },
  ] },
  { 
    label: "Records", 
    href: "/records", 
    items: [
      { label: "The Realm's Ledger", href: "/stats" },
      { label: "Scrolls from the Realm", href: "/scrolls" },
      { label: "The Book of Brothers", href: "/book-of-brothers" },
      { label: "Echoes of the Realm", href: "/quotes" },
    ],
  },
  { label: "The Raven's Eye", href: "/ravens-eye" },
  { label: "The Great Game", href: "/cards" },
];

// Flattened version — every group's children pulled up into a single flat
// list of links. Use this anywhere that just wants a plain list of
// {label, href} items (e.g. a homepage button grid) instead of the
// dropdown-aware NAV_ITEMS.
export const FLAT_NAV_ITEMS: NavigationItem[] = NAV_ITEMS.flatMap((entry) => {
  if (isNavigationGroup(entry)) {
    // Include the group's main link (if it has one) PLUS its sub-items
    const mainLink = entry.href ? [{ label: entry.label, href: entry.href }] : [];
    return [...mainLink, ...entry.items];
  }
  return [entry];
});
