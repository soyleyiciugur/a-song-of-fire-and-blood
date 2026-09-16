ASOFAB community rewrite — 16 Sep 2026

This patch is intentionally merge-safe: it edits your CURRENT repository data instead of replacing data/flea-bottom.json or data/forum.json with an older snapshot.

1. Copy this ZIP's files into the repository root.
2. Run:
   node scripts/apply-community-rewrite-20260916.mjs
3. Validate:
   npm.cmd run validate:comments
   node scripts/test-community-publication.mjs
   node scripts/validate-community-schedule.mjs
4. Then run the real sync against your linked Supabase project:
   npm.cmd run community:sync

What the script does:
- preserves existing gallery records if these five IDs already exist, while fixing their media paths;
- deletes ALL existing editorial gallery comments for the five target IDs and authors them again from scratch;
- does not comment about Aysu personally on gallery-cursed-kuzgun; reactions target only the cursed human/raven merge;
- adds one selective editorial reply to luck's live POCKET CAKE forum post (Supabase parent UUID 4c5ddc55-c673-4527-832d-12a8d9eb91a4);
- replaces the current 24-hour schedule with a fresh 24-slot batch while preserving schedule history;
- adds today's update note.

The included media files use the gallery paths expected by the patch.
