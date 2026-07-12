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
  { label: "Dragons", href: "/dragons" },
  { label: "Houses", href: "/houses" },
  { label: "Map", href: "/map" },
  { label: "The Raven's Eye", href: "/ravens-eye" },
  { label: "Timeline", href: "/timeline" },
  { 
    label: "Records", 
    href: "/records", 
    items: [
      { label: "Scrolls", href: "/scrolls" },
      { label: "The Book of Brothers", href: "/book-of-brothers" },
    ],
  },
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