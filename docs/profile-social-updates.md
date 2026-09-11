# Profile and messaging configuration

Apply these migrations after the existing member-social migration:

- `20260911120000_profile_identity_currency.sql`
- `20260911121000_raven_giphy.sql`
- `20260911122000_profile_reactions.sql`

They preserve existing member_likes and editorial upvotes. Forum reactions display as Favor; Raven's Eye and message reactions display as Like. Historical editorial Hasocash awards remain in source data and do not fund account wallets.

Configure `NEXT_PUBLIC_GIPHY_API_KEY` in the deployment environment and rebuild. This is a GIPHY browser API key: GIPHY requires client-side searches, so it is visible in browser requests. Do not use a server secret in this variable. With no key, the composer explains that GIF search is not configured. GIF search uses GIPHY's returned media URL; private uploads still use raven-media.

Wallets start at zero for both existing and new profiles. There is no earning mechanism. Only the `grant_hasocash` RPC transfers existing balances. It locks wallets in stable order and accepts an idempotency UUID. Wallets and transfer history are visible only to their owners/participants. Do not allow client updates or inserts through RLS.

Profile affinity is a JSON object keyed by field name. The catalog in lib/profileAffinity.ts supplies labels, canonical IDs and links. Quote IDs hash the speaker, chapter and quote text rather than depending on array order. Add future fields to this catalog without restructuring profiles.

Update Notes uses one date entry with `items` (all notes), `features` (the major-feature subset), and optional `links` keyed by exact note text. Entries not in `features` appear in Fixes. Preserve historical items; put new concise entries in the actual Istanbul implementation day.

Validation: npm run test:social, npm run test:raven-ui, npx tsc --noEmit, npm run build. Browser GIF searches use a mocked provider response; real provider access requires a configured key.
