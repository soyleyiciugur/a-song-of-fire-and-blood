# Community authoring workflow

This workflow keeps authored ASOFAB character/community accounts in the repository while letting future editorial batches react to live real-member activity stored in Supabase.

## Run

```bash
npm run community:inbox
```

The command reads only public community data from Supabase and writes `.tmp/community-inbox.json`. It never exports email addresses, auth tokens, Direct Raven messages, or other private auth data.

By default it fetches activity since the previous run. To rebuild from a specific time:

```bash
npm run community:inbox -- --since=2026-09-10T00:00:00.000Z
```

## Authoring pass

When asked to "run the community workflow":

1. Run `npm run community:inbox` first.
2. Read `.tmp/community-inbox.json` together with `data/flea-bottom.json`, `data/forum.json`, `docs/flea-bottom-community.md`, `docs/forum-community.md`, `data/community-schedule.json`, the relevant gallery/chapter entry and any relevant character lore.
3. Treat live members as real participants, not fictional personas. Preserve their wording and never invent private facts about them.
4. Add only editorial fictional-account activity that is natural for the conversation: new roots, replies, forum threads/replies, and scheduled follow-ups. Not every live activity needs a character response.
5. A repository-authored reply to a live Supabase comment/post may use that live UUID as `parentId` and must set `parentSource: "supabase"`.
6. A repository-authored reply inside a live Supabase forum thread may set `liveThreadId` to the live thread UUID and use that same value as `entryId`.
7. Schedule future editorial activity with explicit `publishedAt` timestamps. A single authoring pass may write several future replies so the conversation continues after deployment without another authoring pass.
8. Never schedule a reply before its live parent existed. Avoid long pre-scripted chains that assume a human will respond in a particular way.
9. Run `npm run community:reactions` after adding editorial threads/comments. If it generates a migration, apply it to the linked Supabase project with `supabase db push --linked` before publishing the content. Supabase must register each repository ID before members can Like it or grant Favor; fetching the inbox does not synchronize this registry.
10. Run `npm run validate:comments` before delivery. This also checks that every repository thread/comment has a reaction-target migration. A successful local check does not replace applying that migration remotely.

## Timing model

This is intentionally batch-based rather than a permanent local bot. If a player comments and the workflow is not run for a day, that comment remains unanswered for a day. The next authoring pass can then create a reply whose publication time is after the pass/deployment, making the delayed response feel natural. Additional future comments may be scheduled at the same time.

Once a player replies again, do not continue an old prewritten branch as though that reply never happened. The next workflow pass should read the new live context and continue from there.
