# Flea Bottom community continuity

When adding or updating `gallery.json`, follow `../docs/flea-bottom-community.md` for every Flea Bottom image AND every reel, regardless of the video's category. Keep `flea-bottom.json` synchronized in the same change.

The user requested English-first, AI-authored comments saved at content-editing time. Do not introduce runtime generation or an API dependency. Read the profiles and existing comments before writing: select 5–10 distinct recurring accounts per new post, preserve their voices and relationships, and write specific reactions and occasional replies. Never replace old conversations just to generate fresh ones.

Prioritize encountering different personalities over comment volume. There is no mandatory core cast: do not automatically include ratio_deluxe, citation_maester, or the same faction stans on every post. Read `interests` and recent appearances, favor relevant less-seen accounts, and keep most selected authors different from nearby comparable posts. A specialist can skip many posts; continuity does not require constant attendance. Usually write one comment per selected author, with occasional conversational replies. For the current expansion, add only 1–3 comments from new accounts per existing reel; do not inflate image threads or rewrite existing comments.

Run `node scripts/validate-gutter.mjs --pending` from the repository root to find uncovered posts; run `npm.cmd run validate:comments` before finishing. Real member registration and comment submission are future work.
