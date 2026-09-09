# Flea Bottom regulars

The community lives in `data/flea-bottom.json`. It covers **all Flea Bottom images and all reels**; video records do not consistently have the `fleabottom` category. `gallery.json` IDs join posts to comments. Do not change those IDs when changing captions or assets.

## Adding a post

1. Add the gallery record. Run `node scripts/validate-gutter.mjs --pending` to find posts without conversations.
2. Inspect the image/video where tools allow, read its caption, character tags and relevant chapter context. Do not invent visual details from a filename. If an asset cannot be inspected, react to the verified caption/lore instead.
3. Read the 12 user profiles (`voice`, `continuity`, public `bio`) and their existing comments. Pick a varied subset of 5–10 distinct users. Selection happens once while authoring, never randomly on page load. Include interested fans but let unrelated users skip posts. Keep the Gen Alpha account occasional.
4. Write English-first internet reactions to this specific joke. Vary length, spelling, intensity and punctuation. A Turkish phrase from the source meme can remain. Include occasional replies with real conversational logic; not every comment needs a reply, faction argument or catchphrase. Users can be wrong, but theories must read as theories and modern AU jokes must not become canon. Avoid recycling whole comments.
5. Save comments with stable `id`, `entryId`, `authorId`, `parentId` and `body`. Roots use `null`; replies point to an earlier root in the same post. One reply level is currently supported. Existing conversations are persisted, not regenerated. Add a continuity note when a recurring new relationship or running joke develops; do not rewrite a user's loyalties on a whim.
6. Run `npm.cmd run validate:comments`, then relevant UI/type checks if code changed. Review tone and lore yourself; structural validation cannot judge a joke.

## Established relationships

- `gaelord_apologist` tries to do Gaelor PR and keeps losing arguments to `breadpilled` and `jacejpeg`. Even the defender is exhausted by cruelty; victims are not the punchline.
- `derrin.exe` sees Hightower clues everywhere and considers the Derrin cameo vindication. `citation_maester` challenges the leaps; a cameo is not proof of every theory.
- `breadpilled` and `crown_enjoyer` argue labor versus monarchy, but have found common ground on food courts, pastries and some municipal infrastructure.
- `swordwife` and `jacejpeg` share Alester appreciation while disagreeing about whose department gets him. The former also supports Saera/Alester.
- `dorne_disconnect` uses lag and strategic retreats to defend Visenor, and cannot reliably defend his craving for dad's approval.
- `StannisOnFacebook` is a polite, literal regular (not the canon character). Likes travel photos and food, advocates bicycle helmets and proofreading letters; returns to beach photos when family drama gets uncomfortable.
- `skibidi_septon` and the maester disagree about trial-of-six-seven arithmetic. `ratio_deluxe` treats court politics as a group chat; `xx_ashtray_xx` has dry, bleak takes about princes and consequences.

## Language refresh

Slang is an editorial choice, not a live internet feed. When specifically refreshing contemporary meme language, check current examples first, then update only suitable voices and future comments. Never paste scraped conversations or make every account use the same trending phrase. Existing comments preserve their era and continuity.

## UI and future accounts

Image cards show comment counts. Open a meme for its thread; reels have an expandable Gutter talk panel. Clicking a username opens the persistent profile bio. The page and profiles identify this cast as fictional regulars. No fabricated likes, online indicators, timestamps, or nonfunctional submit forms are present.

`kind: fictional | member`, independent author IDs, post IDs and parent IDs allow future storage to retain these threads alongside real members. This release has no authentication, member database or submission endpoint. When those arrive, resolve author identity on the server; never trust a client-supplied author ID. Fictional authors must remain distinguishable from registered members.

Removing a gallery entry also requires explicitly removing its thread, or migrating it with a deliberate ID mapping. Validation rejects orphaned comments and uncovered posts. Admin publishing does not generate comments: the agreed workflow is AI-assisted content editing in the repository.
