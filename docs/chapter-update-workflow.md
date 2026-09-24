# Chapter update workflow

This is the living post-prose workflow for a new or substantially revised
chapter. Update this document and `config/chapter-update-workflow.json` whenever
a new site feature begins consuming chapter canon.

## Invocation commands

### Full workflow

These requests run every applicable stage through publication readiness:

- `run update workflow`
- `run chapter update workflow`
- `chapter update workflow'u çalıştır`
- `chapter update'i çalıştır`

The full command includes the community workflow and Supabase community sync.
It does not itself authorize Git commit/push, deployment, or unrelated database
migrations.

### Partial commands

- `run chapter canon extraction`: stages `canon` and `knowledge`.
- `run chapter state sync`: stages `world`, `characters`, `relationships`,
  `dragons`, and `dynasty`.
- `run chapter archive sync`: stages `chronology`, `map`, `bloodshed`,
  `records`, `gallery`, and `companion`.
- `run chapter discovery checks`: stages `search`, `spoilers`, and `navigation`.
- `run chapter community`: stages `forum`, `community`, and `notifications`.
- `run chapter quotes`: pause for the user's quote selections, then perform the
  manual quotes stage only.
- `run chapter validation`: Update Notes if applicable, then validation, build,
  and smoke tests. It does not repair missing editorial work silently.
- `run chapter publish checks`: publication ordering, scheduled visibility,
  canonical links, notification target, and post-publication checks. It does
  not deploy or Git-push without an explicit request.

A partial command must report which downstream stages remain pending.

## Decision rules

- Read the complete chapter scene by scene; do not extract canon from a name
  search or summary alone.
- Classify statements as fact, report, lie/forgery, theory, dream, flashback,
  memory, or character interpretation before updating derived data.
- Track what each character knows at chapter end. Reader knowledge is not
  automatically character knowledge.
- Ask the user when a decision would resolve intentional ambiguity, choose a
  quotation, assign an uncertain identity, establish a rider/claim, classify a
  debatable Book of Brothers deed as major, or otherwise create canon.
- Keep durable workflow rules here. Keep conditional identities, titles,
  relationships, mysteries, and chapter-specific knowledge boundaries in
  `docs/chapter-specific-rules.md`.

## Full sequence

1. **Prose gate** — confirm EN/TR prose is final enough to derive data. Preserve
   scene order, dialogue intent, scene breaks, and ambiguity in both languages.
2. **Canon extraction** — produce a scene ledger and reliability classification.
3. **Knowledge state** — record who knows, suspects, misunderstands, or does not
   know each consequential fact.
4. **World date** — update `data/worldDate.json` only to the latest explicit
   current-timeline date; a flashback or reported date must not advance it.
5. **Characters** — review debut, public and secret status, title, location,
   biography, goals, aliases, death data, personal timeline, and the Inner
   Court surface. A mention is not a debut; aliases/disguises do not create new
   characters. Do not manufacture player-owned private beliefs merely to bring
   `data/character-inner-court.ts` or `character_inner_court` up to the latest
   chapter; update only thoughts established by the player or existing canon.
6. **Relationships** — update real changes reciprocally. Keep one-sided beliefs,
   manipulation, and misunderstandings in the correct character perspective.
7. **Dragons** — update `data/dragons.json` and physical appearances separately.
   Reports, memories, heraldry, props, and uncertain silhouettes are not
   appearances. Never assign an identity, rider, or claim from character belief.
8. **Dynasty and houses** — when applicable, synchronize houses, parentage,
   unions, family tree, royal chronology, and succession.
9. **Timeline and events** — add major chapter beats to the timeline; add only
   independently dateable named occurrences to `data/events.json`. Flashbacks
   use their historical date and do not masquerade as current events.
10. **Map and locations** — update real journeys and persistent current
    positions. Do not turn a short scene location into a permanent position.
    Register genuinely new canonical locations when necessary.
11. **Calendar and Bloodshed** — reconcile exact/approximate dates and evaluate
    deaths, battles, massacres, executions, and trials by combat.
12. **Records** — conditionally review Book of Brothers, Scrolls, Artifacts, and
    other archival surfaces. Book of Brothers accepts only unquestionably major
    deeds; ask when uncertain. A document seen in prose is not automatically a
    publishable Scroll.
13. **Quotes (manual)** — do not select quotes automatically. Ask the user for
    their selections, then store the correct canonical speaker, chapter,
    context, alias/display context, and spoiler boundary.
14. **Gallery and reels** — synchronize chapter, character, house, dragon, and
    spoiler metadata. Validate assets and same-basename reel posters. Do not
    duplicate a chapter cover as gallery content unless intentionally requested.
15. **Forum/Taverns** — create exactly one canonical chapter discussion with the
    correct slug, boundary, author, timestamps, and opening. Scheduled content
    cannot predate the chapter or its parent.
16. **Chapter Companion** — validate its canonical inputs rather than copying
    them: timeline cast, positions/routes, gallery art, forum discussion, and
    dragon appearances.
17. **Search** — verify discoverability without leaking sealed titles, statuses,
    quotes, outcomes, aliases, or snippets beyond the reading boundary.
18. **Spoiler and navigation regression** — preserve existing users' boundaries
    and progress; verify Previous/Next, Continue Reading, chapter order, and
    mark-read/unread behavior.
19. **Slug and reference integrity** — remove stale draft slugs from deep links,
    anchors, forum, gallery, notifications, search, and derived data. Validate
    IDs, parents, speakers, characters, dragons, houses, locations, and anchors.
20. **Visible-number rule** — in applicable House of the Dragon-font in-world
    prose/display fields, spell out Arabic numerals and dates. Roman chapter
    numerals and technical/UI values are exempt. Check only scoped fields.
21. **Community workflow** — run the inbox-first workflow in `AGENTS.md`, author
    reactions from current context, generate reaction targets, sync Supabase,
    and advance checkpoints only after processing the relevant batch.
22. **Notifications** — verify the new-chapter target and deduplication without
    mixing site notifications into Direct Raven grouping/unread semantics.
23. **Update Notes** — after implementation, add only completed user-visible
    work to the actual Europe/Istanbul implementation date.
24. **Final validation** — run applicable data/comment/publication tests,
    TypeScript, build, scoped content checks, and `git diff --check`.
25. **Manual smoke tests** — check desktop and narrow mobile across the chapter,
    Companion, linked profiles, dragons, dynasty/succession when affected,
    Timeline/Chronicle/Map/Calendar/Bloodshed, Records, Gallery, Search, Taverns,
    notifications, homepage world date, and other registry targets.
26. **Publication readiness** — ensure all dependent data is ready before the
    chapter becomes visible or sends `new_chapter`. After publication, verify
    the live chapter URL, discussion visibility, notification deep link, and no
    premature scheduled content.

## Validation baseline

Run what is relevant to the touched surfaces, normally:

```text
npm.cmd run validate:data
npm.cmd run validate:comments
node scripts/test-community-publication.mjs
npx.cmd tsc --noEmit
npm.cmd run build
git diff --check
```

Separate new failures from unrelated pre-existing failures. A local pass does
not prove a Supabase migration or production notification was applied.

## Maintaining the workflow

`config/chapter-update-workflow.json` is the inventory used to discover affected
surfaces. When adding a feature that consumes chapter, character, date, map,
dragon, house, archive, search, spoiler, community, or notification state:

1. add it to the appropriate stage's `targets`;
2. add its relevant files/routes and validation command;
3. document any new editorial decision rule here;
4. add conditional lore instructions only to `chapter-specific-rules.md`;
5. update smoke-test coverage.
