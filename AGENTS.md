<!-- This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\AGENTS.md -->
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Character debut records

Character debut means the chapter in which the character first physically
appears on the page. A name being mentioned, a title referring to an absent
character, or another character recalling them does not count as a debut.

Store the confirmed chapter slug explicitly in the character's
`debutChapter` field in `data/characters/characters.json`. Do not infer or
overwrite debut records through an automated name search. Read the scene in
`data/chapters.json` and, when relevant, compare the earlier session notes and
established character identity. An unnamed role may count only when the text
or later continuity identifies that person reliably, such as an unnamed
maester later established to be the same named character.

When the first physical appearance remains ambiguous, leave `debutChapter`
unset and ask the user rather than treating the earliest mention as a debut.

# Daily update notes

Records is reserved for in-world records. Keep Update Notes accessible only from the homepage's lower Latest Updates section heading, not from the navbar, hero shortcut grid, Notifications, or Records menu. The user designated 2026-09-09 as the date for the comment-system launch note.

After implementing site changes, update `data/update-notes.json` in the same change. The `/update-notes` page renders this file. Use the actual implementation date in Europe/Istanbul as `YYYY-MM-DD`, with one entry per day and newest dates first. Append concise English bullet points to that day's `items`; create a new date entry when needed. Describe completed user-visible changes, not plans or unverified results. Preserve older entries and avoid duplicate notes. Do not invent historical updates or use in-world dates. Update the notes after the changes are applied and before final validation and delivery.

# Community workflow

When the user says:

- "community workflow'u çalıştır"
- "run the community workflow"
- "run community workflow"
- "run community sync"
- "yeni fotoğraf/video/forum içeriği için community'yi çalıştır"

treat this as a concrete authoring workflow, not as a request for an explanation.

The phrases "run community workflow" and "run community sync" both mean the
full workflow below. "community sync" is not limited to pushing migrations:
review the inbox and editorial context first, author only appropriate activity,
then run `npm.cmd run community:sync` after the data changes.

## Workflow

1. Run:

   npm run community:inbox

2. Read:

   .tmp/community-inbox.json

3. Also inspect the relevant editorial/community context:

   - data/flea-bottom.json
   - data/forum.json
   - data/community-schedule.json
   - docs/flea-bottom-community.md
   - docs/forum-community.md
   - relevant gallery/chapter/character data
   - existing comments/posts by the same fictional accounts
   - any personality/continuity notes relevant to those accounts

4. Treat Supabase member activity as live context.

   Real member activity may include:
   - Raven's Eye comments
   - forum threads
   - forum replies
   - replies to fictional/editorial accounts
   - ongoing discussions between members

5. Author new fictional community activity that naturally reacts to BOTH:
   - newly added site content
   - live member activity from Supabase

6. Possible editorial activity includes:
   - Raven's Eye comments
   - replies to real members
   - replies between fictional accounts
   - new forum threads
   - forum replies
   - participation in live user-created threads
   - likes/reactions where the existing data model supports them
   - scheduled follow-up activity

7. Preserve each fictional account's established personality, vocabulary,
   biases, relationships, recurring jokes, hostility level, fandom behavior,
   and previous opinions.

8. Do not make every fictional account react to every item.

   Prefer selective, believable activity:
   - direct replies should have higher priority
   - active arguments may attract more accounts
   - some comments can be ignored
   - some accounts can arrive late
   - some characters can disagree strongly
   - hostile/toxic/anti-story accounts do not need to become nicer
   - fictional accounts may criticize the scenario, writing, characters,
     moderation or other users if that matches their established personality

9. When useful, schedule follow-up comments/replies over time instead of
   publishing an entire conversation immediately.

10. A repository-authored fictional reply may target a live Supabase item
    using the existing live-parent mechanism, including:

    parentSource: "supabase"

    and the real Supabase parent UUID.

11. If a real member has replied since a previously planned branch was written,
    re-read the live conversation before extending that branch.
    Never blindly continue a stale prewritten conversation when newer player
    context changes what the fictional accounts should say.

12. Never create Supabase auth accounts for fictional characters.

13. Never export or expose:
    - email addresses
    - passwords
    - auth tokens
    - refresh tokens
    - secret keys
    - Direct Raven private messages

14. Live member records remain in Supabase.
    Editorial fictional activity remains repository-authored unless explicitly
    requested otherwise.

15. Apply the resulting editorial changes directly to the appropriate repository
    JSON/data files and validate them.

16. Run `npm.cmd run community:sync` after reaction-target generation to create
   and apply pending migrations to the linked Supabase project before
   publishing.

17. After completing user-visible site changes, update data/update-notes.json
    according to the Daily update notes rules in this file.

## Community inbox command

The normal command is:

npm run community:inbox

It MUST NOT advance the workflow checkpoint merely because the inbox was read.

Use:

npm run community:inbox -- --all

only when all available public member activity needs to be reloaded.

Use:

npm run community:inbox -- --mark-seen

only after the relevant batch has actually been reviewed/processed, not merely fetched.
