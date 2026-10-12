# Unspoken Counsel

Implementation date: 2026-10-12 (Europe/Istanbul).

## Ownership and visibility

- `/characters/<id>/thoughts/survey` is available only to the account in
  `character_player_assignments`. The server page and write handler both check
  this assignment. Repository fallback attribution never grants write access.
- Jacaelon, Visenor and Gaelor each have twelve questions in four steps.
  `/characters/hrrm/thoughts` hosts HRRM's private GM court and separate
  twelve-question assessment survey. It does not change player-owned beliefs.
- Normal thoughts remain public within the reader's chapter boundary.
  Private thoughts are visible to their assigned owner and HRRM; the additional
  GM-hidden flag restricts them to their assigned owner. Database RLS enforces
  this distinction, including direct Supabase queries.
- Survey drafts are always owner-only, even when a particular answer will
  eventually produce a public entry. They are not stored in localStorage.

## Saving and revisions

- Choices and notes autosave after a short delay, with serialized writes and
  revision checks. Another tab's newer revision is never silently overwritten.
- Abstentions are mutually exclusive with substantive selections; substantive
  selections support multiple choices. A note alone is a valid answer.
- **Save draft** persists the current step and answers without publishing.
  **Save answered thoughts** atomically saves the draft and transfers meaningful
  answers to Inner Court. An abstention without a note creates no thought.
- **Complete & seal survey** requires an answer, note or explicit abstention for
  every question. The completion indicator remains passive, with a separate
  revisit link. Answers remain editable after completion.
- Stable survey/question keys update the linked entries instead of duplicating
  them. Clearing a previously transferred answer removes its linked entry on
  the next transfer. Direct edits to survey-generated entries are preserved
  until that answer is explicitly transferred again; the survey explains this.
- Multi-character links and privacy fields are shared with the ordinary entry
  editor. The searchable picker includes all characters and shows titles to
  distinguish repeated names.

## Chapter Counsel

- Previous, Next and section navigation scroll to the first question of the
  newly rendered step and focus its heading. Reduced-motion settings are
  respected. Completion has its own screen with **See chapter-related surveys**
  and **Revisit these answers**.
- `/characters/<id>/thoughts/survey/chapters` lists all twenty-one chapters in
  canonical order, with chapter-specific progress and completion. A mini survey
  opens at `/characters/<id>/thoughts/survey?chapter=<slug>`.
- `data/inner-court-chapter-surveys.ts` explicitly groups the canonical timeline
  events and authors the player viewpoints. Timeline cast membership never
  automatically grants a character knowledge. Absent characters receive no
  filler questions; a locked chapter reveals no title, events or question count.
- Each relevant event group produces one short question with multiple choices
  and optional notes. Player mini-surveys have one to four questions; GM surveys
  cover all scene groups, including perspectives unavailable to players.
  Chapter XXI has three Jacaelon questions, two Visenor questions and none for
  Gaelor, who has not been told about the private mission discussions.
- Chapter surveys are independent of onboarding and of each other: their
  answers, revision counters and completion timestamps use a chapter scope.
  Existing onboarding progress is preserved. Entry keys are scoped as well, so
  revising one chapter cannot replace another chapter's thoughts.
- Inner Court opens in chapter chronology, oldest first. Manual ordering and
  the other existing sort choices remain available.

## Delivery and validation

The required schema changes are
`supabase/migrations/20261012150000_inner_court_survey_privacy.sql` and
`supabase/migrations/20261012160000_inner_court_chapter_surveys.sql`.
Apply them before publishing the new UI. The second migration preserves any
existing onboarding rows while introducing independent chapter scopes.
The linked dry run on 12 October confirmed the first migration is already
applied remotely; only `20261012160000_inner_court_chapter_surveys.sql` remains
pending. This task did not apply a remote migration.
Remote application requires explicit user approval because
automatic approval review rejected the shared security-boundary change.

`node scripts/test-inner-court-survey.mjs` checks canonical references, answer
conversion and the actual migration in PostgreSQL/PGlite: owner, HRRM, other
member and anonymous visibility, draft isolation, hidden thoughts, conflict
rollback, atomic transfer, deduplication and withdrawal.
It also validates all chapter inventories and source references, selected
character-knowledge boundaries, independent chapter completion/revisions, and
preservation of a draft saved before the chapter-scope migration.

Desktop and 390px mobile interaction checks used a temporary local preview
with mocked survey writes; no real player answers were created. The preview
route was removed after verification. Live authenticated save/reload checks
remain dependent on applying the migration.
