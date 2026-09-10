<!-- This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\AGENTS.md -->
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Daily update notes

Records is reserved for in-world records. Keep Update Notes accessible from the homepage's Latest Updates section, not the Records menu. The user designated 2026-09-09 as the date for the comment-system launch note.

After implementing site changes, update `data/update-notes.json` in the same change. The `/update-notes` page renders this file. Use the actual implementation date in Europe/Istanbul as `YYYY-MM-DD`, with one entry per day and newest dates first. Append concise English bullet points to that day's `items`; create a new date entry when needed. Describe completed user-visible changes, not plans or unverified results. Preserve older entries and avoid duplicate notes. Do not invent historical updates or use in-world dates. Update the notes after the changes are applied and before final validation and delivery.
