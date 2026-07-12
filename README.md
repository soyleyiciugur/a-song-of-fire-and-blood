<!-- This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\README.md -->
# A Song of Fire and Blood

A Next.js app for exploring a compact House Targaryen chronicle: chapters, characters, houses, dragons, a family tree, a map, relationships, and timeline views.

## Run It

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` starts the app in development.
- `npm run build` creates a production build.
- `npm run start` serves the production build.
- `npm run lint` runs ESLint.
- `npm run validate:data` checks the core lore datasets for broken references.

## Project Layout

- `app/` routes and top-level pages.
- `components/` reusable UI, including character, nav, map, and family-tree pieces.
- `data/` story content and map metadata.
- `lib/` shared helpers for lookup, search, portraits, and map behavior.
- `public/images/` artwork and assets.
- `styles/` global design tokens and shared CSS.
- `types/` domain types for chapters, characters, and map data.

## Data Notes

- Character, chapter, dragon, and house content lives in `data/`.
- Search indexes are built from those datasets.
- The validation script catches missing references between characters, quotes, houses, dragons, chapters, and map events.

## Keeping The Repo Clean

- `zgitpush.txt` and `a-song-of-fire-and-blood.zip` are intentionally kept.
- Generated files like `.next/` and `tsconfig.tsbuildinfo` should stay out of source control unless you explicitly need them.
