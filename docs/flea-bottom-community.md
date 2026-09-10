# Flea Bottom regulars

The community lives in `data/flea-bottom.json`. It covers **every gallery entry**, including Raven's Eye canon images, Flea Bottom images and all reels. `gallery.json` IDs join posts to comments. Do not change those IDs when changing captions or assets. Canon media remains canon; casual reader reactions and comic social-AU cameos are not new canonical events.

## Adding a post

1. Add the gallery record. Run `node scripts/validate-gutter.mjs --pending` to find posts without conversations.
2. Inspect the image/video where tools allow, read its caption, character tags and relevant chapter context. Do not invent visual details from a filename. If an asset cannot be inspected, react to the verified caption/lore instead.
3. Read the user profiles (`voice`, `continuity`, public `bio`, and `interests`/`postingStyle` where present) and their existing comments. Pick a varied number of distinct users. There is no five-comment floor or fixed per-post target: quiet posts can have one or two reactions, while busier posts naturally have more. Selection happens once while authoring, never randomly on page load. Prioritize variety over volume: there is no mandatory core cast. Look at the last few comparable posts and favor relevant accounts readers have seen less often. Most participants should differ from nearby threads; do not routinely bring the same meme account, lore corrector, and prince defenders to every post. Usually give each selected account one comment, with an occasional reply. Include interested fans but let unrelated users skip many posts. Keep the Gen Alpha account occasional.
4. Write English-first internet reactions to this specific joke. Vary length, spelling, intensity and punctuation. A Turkish phrase from the source meme can remain. Include occasional replies with real conversational logic; not every comment needs a reply, faction argument or catchphrase. Users can be wrong, but theories must read as theories and modern AU jokes must not become canon. Avoid recycling whole comments.
5. Save comments with stable `id`, `entryId`, `authorId`, `parentId`, `body` and an explicit UTC ISO `publishedAt`. Roots use `null`; replies point to an earlier root in the same post and cannot publish before it. One reply level is currently supported. Existing conversations are persisted, not regenerated. Add a continuity note when a recurring new relationship or running joke develops; do not rewrite a user's loyalties on a whim.
6. Run `npm.cmd run validate:comments`, then relevant UI/type checks if code changed. Review tone and lore yourself; structural validation cannot judge a joke.

## Established relationships

- `gaelord_apologist` tries to do Gaelor PR and keeps losing arguments to `breadpilled` and `jacejpeg`. Even the defender is exhausted by cruelty; victims are not the punchline.
- `derrin.exe` sees Hightower clues everywhere and considers the Derrin cameo vindication. `citation_maester` challenges the leaps; a cameo is not proof of every theory.
- `breadpilled` and `crown_enjoyer` argue labor versus monarchy, but have found common ground on food courts, pastries and some municipal infrastructure.
- `swordwife` and `jacejpeg` share Alester appreciation while disagreeing about whose department gets him. The former also supports Saera/Alester.
- `dorne_disconnect` uses lag and strategic retreats to defend Visenor, and cannot reliably defend his craving for dad's approval.
- `StannisOnFacebook` is a polite, literal regular (not the canon character). Likes travel photos and food, advocates bicycle helmets and proofreading letters; returns to beach photos when family drama gets uncomfortable.
- `skibidi_septon` and the maester disagree about trial-of-six-seven arithmetic. `ratio_deluxe` treats court politics as a group chat; `xx_ashtray_xx` has dry, bleak takes about princes and consequences.

## Occasional voices

The expanded cast is deliberately sparse: new accounts initially appear in only a few of the existing reels. They are eligible for future memes as well as videos; their interests, rather than their being new, should determine where they appear.

- Craft and hobbies: `keyframe_goblin` edits videos, `auxcord_wight` collects soundtracks, `ponygirl_2004` worries about horses, `newtposting` thinks about dragon ecology, `bulkseason_boros` offers sensible gym advice, and `OnionKnightEats` just wants food.
- Work and institutions: `sumif_broke` reconciles accounts, `root_access_denied` thinks in permissions and incident logs, `wagonmaxxer` asks about supplies, `hustlemaester` posts career lessons, `footnote_404` interprets court ritual, and `objection_lol` picks apart dramatic courtroom logic.
- Different everyday perspectives: `rentdue99` lives with the capital's inconveniences, `dockside_dave` distrusts speeches from people who never unload boats, `wintermute_89` wants southern problems to stay south, and `parlay_peasant` keeps getting imaginary bets wrong.
- Selective character fans: `lemoncake.mp3` centers Lorenah, `velvet_tax` wants Maela's perspective, `shield_main` follows Saathos independently of Gaelor, and `pearl_clutch.exe` cares about Naella and wives being treated as people.
- Less performative voices: `AuntieMyrtle7` is a religious aunt with pointed manners, `MumsBookClub` is an emotionally invested reader, `tab_38` procrastinates with recap reels, and `moth_in_4k` is a shy, sincere lurker. Let them sound earnest or uncertain; not everyone needs a punchline.

## Broader cast and ordinary behaviour

The latest expansion includes all 32 suggested audience types plus eight additional voices. They are writing tendencies, not compulsory topics. The public bio should usually sound like something a person might actually leave on an account; the authoring-only `voice`, `interests`, and `continuity` fields hold the fuller personality. Thirty earlier bios were relaxed accordingly. Keep explicit single-character stan profiles as a minority.

- Conflict and politics: `gaelorflop`, `velvetvillain69`, `graveyardwifi`, `formerly_toxic31`, `nuance_pending`, `justshowthedragon`, `LadyRespectfully`, `seven_not_the_crown`, `realm_can_change`, `splittercell99`, `invisible_handjob`, `principles_on_pause`.
- Fandom habits: `receipts_since_2014`, `before_the_edits`, `wait_whos_his_dad67`, `fixitfic_department`, `two_frames_is_canon`, `unfollowed_the_wedding`, `lavender_footnotes`, `her_wrong_answers`, `feats_over_feelings`.
- Social feeds and generations: `realmspor55`, `ivory.and.ashes`, `heal_with_wildfire`, `GulayHanim61`, `KemalUsta1962`, `NanaReadsFantasy`, `second_marriage_patch`, `this_happened_to_me`, `OldtownVisitorCentre`, `dragonfacts_247`, `seen_at_03_17`.
- Additional everyday voices: `mulligan_mert31` (The Great Game and other interests), `one_more_scroll69`, `de_ayri`, `polls_and_vibes`, `eyvallah_bestie`, `spare_charger_67`, `tiny_good_news`, `hotglue_casualty`.

Use the contrasts: the nihilist enjoys a pastry; the centrist sometimes sees no need for both sides; the hostile anti-fan is moved by a sad scene; the older reader understands people perfectly well; the craft hobbyist can just react without mentioning glue. A new fan should gradually learn. Several users can agree, have no joke ready, or leave an ordinary short reaction. Do not give everyone identical ironic fluency or an encyclopedic recall of canon. Fictional personal anecdotes are fine; do not invent actual observations, receipts, source quotations, or The Great Game mechanics.

Each newly introduced account starts with only one or two comments. They are not a new mandatory posting block. The initial broad-cast pass adds 50 comments while preserving earlier comments under the then-current author limit, which has now been removed. Future posts should rotate the wider pool instead of increasing thread volume to fit everyone.

## Language refresh

### Invincible and broader brainrot

`skibidi_septon` already covers occasional aura/Gen Alpha-style jokes. Five additional sparse voices widen this without making everyone speak the same way:

- `viltrumite_wifi`: Invincible crossover/powerscaling reflexes, with ordinary reactions outside those interests.
- `think_mert_think`: occasional short quote riffs, including the existing THINK MARK THINK meme; also simply chats about the scene.
- `atom_eve.png`: an Invincible edit fan with emotional and everyday interests, not a constant franchise-reference account.
- `cooked_by_default`: self-deprecating task-failure and gaming brainrot, distinct from aura arithmetic.
- `fridge_lore69`: brief absurd associations mixed with normal conversation; the username is not a required joke topic.

Each starts with two comments: nine across suitable reels and one reply on the directly relevant THINK MARK THINK image. Keep them rare in future selection, preserve ordinary bios, and allow comments without any catchphrase. Invincible crossovers are jokes/headcanon, never claims about this story's canon. Do not fabricate feats, episode details, or current-season spoilers. Prefer short familiar references over copied dialogue or forced trend lists.

Slang is an editorial choice, not a live internet feed. When specifically refreshing contemporary meme language, check current examples first, then update only suitable voices and future comments. Never paste scraped conversations or make every account use the same trending phrase. Existing comments preserve their era and continuity.

## UI and future accounts

### Story criticism and impossible ships

Four additional regulars start with three comments each, plus one reply from the existing shipper (13 new comments total). `drafts_were_better` is a real critic of story choices, sometimes petty but able to articulate repetition or pacing problems; a quiet scene can still win them over. `trust_the_outline` genuinely likes the storytelling but cannot promise future payoffs or claim insider plans. `sidequest_ada` can say “personally I liked it, but I get the criticism” and explain why; unlike `nuance_pending`, she need not hedge every opinion. Their first shared thread is on HRRM's Genius, with separate appearances elsewhere. The critic and defender have a strained relationship; Ada is friends with both. Do not turn every criticism into a lesson about being nicer, or deploy all three as a compulsory debate panel.

`zero_shared_scenes` deliberately enjoys impossible pairings rather than searching for canonical proof. Private `shipPreferences` include Jace/Rhaella, Jace/Visenor, Alester/Godfrey, Gaelor/Maela, Baelenys/Alyssa Velaryon and Jaery/Alester. Relevant initial posts mention Jace/Rhaella and Jace/Visenor; another comment simply enjoys a quiet afternoon. The other preferences can stay unused until a suitable post appears. Keep references non-explicit, do not invent encounters or romantic outcomes, and never present headcanon as canon. `two_frames_is_canon` welcomes the even-lower evidence standards with friendly banter. The public bio stays ordinary and does not list every ship.

### Fandom coverage and profile details

`data/flea-bottom-fandoms.json` covers the 56 requested areas, plus Disco Elysium, Baldur's Gate, Stardew Valley, wrestling, and the previously added Invincible. The 52 new profiles cover new territory; eight existing profiles cover ASOIAF, gaming, music, pop fandom, fantasy literature, fanfic, cosplay, and editing. Existing Invincible profiles carry their tag too. Validation checks every area has a profile, not that every profile has posted.

Fandom interests stay in the authoring data. Do not insert a franchise comparison when a plain reaction would be more natural. The 52 new fandom accounts now all participate: after the initial 16 comments, each received one suitable additional comment spread across existing posts. Keep sprinkling them into relevant conversations; don't force a franchise reference or bring in a whole fandom group. English-first Gen Z speech is the default with explicit exceptions such as the older Trekkie, comfort-sitcom reader or MMO player.

Handle patterns deliberately mix names, initials, old nicknames, small number suffixes, separators, file extensions, short phrases, an occasional explicit fandom handle, and apparent availability workarounds. These are fictional creations, not copied real accounts or claims about statistically common handles. Official references for handle/display-name separation and allowed patterns: [X profile names](https://help.x.com/en/managing-your-account/change-x-handle), [X username guidance](https://help.x.com/en/managing-your-account/x-username-rules), [TikTok profile names](https://support.tiktok.com/en/getting-started/setting-up-your-profile/changing-your-username).

The expandable profile now supports optional `displayName`, `pronouns`, `location`, and a single `current` detail with a label and value. These are authored profile snapshots, not a live activity feed. Not everybody fills every field. Display names do not replace stable handles or author IDs. The profile also shows comment and distinct-post counts calculated from the stored comments. Avoid fabricated followers, verification, online states and join dates. Public profile details do not expose the author's full personality instructions or a wall of fandom badges.

Image cards show published comment counts. Open any image for its thread; reels have an expandable Gutter talk panel. Clicking a username opens the persistent profile bio. The page and profiles identify this cast as fictional regulars. No fabricated likes, online indicators or nonfunctional submit forms are present. Publication dates refer to site publication, not invented historical activity.

### Publication, notifications and friends

`/api/community` is the sole server publication boundary, using the server clock with `Cache-Control: private, no-store`. Never import `flea-bottom.json` or scheduled bodies into a client module. Public responses omit future comments entirely, suppress replies until their parent is visible, and strip authoring instructions and relationship history. Counts, character pins and notifications are derived from this same published snapshot. A shared client store refreshes every 15 seconds while visible and immediately on focus; an open page may show a released comment up to 15 seconds after its timestamp. No cron job, external service or runtime AI generation is required, but deployment needs a running Next server (not a static export).

The initial archive was assigned its actual migration time on 10 September 2026; no historical conversation dates were invented. The revised plan in `data/community-schedule.json` contains ten candidate publication times. Only three randomly selected windows contain comments; seven are intentionally empty. The selection was made once and saved. Active windows are 10 September 21:30, 11 September 16:10 and 11 September 23:50, Europe/Istanbul (UTC+03:00), with a varying number of comments on newest entries in each. This replaces the earlier three-time plan; it does not mean three posts at every window. Future content editing may add a few similarly spaced comments to new entries. Persist the explicit UTC date; never calculate a fresh relative delay at build or request time.

The navbar bell opens `/notifications`. Latest comments sorts by publication time descending, with reverse source order breaking ties. Links preserve entry and comment IDs, open the correct image/reel, expand its thread and focus the target reply or root. Unpublished or missing IDs show a generic unavailable state. The Update Notes link opens the shared `/update-notes` archive. Its canonical `update-notes.json` stores one `{ date, items }` record per implementation day, newest first; the comment-system launch note stays on 9 September 2026.

Both notification tabs split their sorted entries into time sections: Now (under five minutes), Earlier this hour, exact elapsed hours within today (for example 3 hours ago or 10 hours ago), Today for older same-day items, Yesterday, then dated sections. Istanbul midnight determines calendar days, and the server snapshot clock advances the headings during normal polling. Keep exact timestamps on entries. Do not backdate archive comments merely to fill every heading. The user clarified that variation must be additive: all 109 comments removed in the earlier thinning were restored verbatim, then 31 selected entries received 1–2 new comments each (45 total). Never remove existing comments to create varied counts. Future posts still have no fixed five-comment minimum.

Profiles show friend counts and a hover/click/keyboard account list derived from the persisted relationship histories. Public `friendIds` are a projection, not a second source of truth. These are social-AU account connections, not a canonical relationship index or fabricated real-member metrics. Zero friends is valid. Do not regenerate connections when rendering. Character avatars reuse the existing canonical mini portraits and their standard fallback.

Run `node scripts/test-community-publication.mjs` for the exact release boundary and privacy checks, `npm.cmd run validate:comments` for all posts and friendships, and `node scripts/check-gutter.cjs` for browser checks.

### Evolving account relationships

The earlier automatic friendship matches were replaced with 96 authored pair histories grounded in account continuity. `relationships` is the sole source of truth; users no longer store duplicate friendship arrays. Each pair has `users: [id, id]` and a chronological `history` of `{ at, kind, note }`. The latest event at or before server time determines whether the two are friends. `friends` and `friendly-banter` count; `rivals`, `strained` and `acquaintances` do not. Lists and counts update together through the existing community refresh. Friendly disagreement is distinct from actual dislike, and common interests do not make everyone friends automatically.

To develop a dynamic, write a believable exchange in the usual editorial workflow, then append a dated history event explaining the change. Preserve previous events. Do not invent past interaction dates, claim private conversations actually happened, or automatically reconcile rivals on a timer. A deliberately future-dated event can take effect later, but its note and status never appear in public data. Public responses include only current friend IDs/counts; the relationship history stays server-only.

Hovering or keyboard-focusing the friend count opens the account list; clicking/tapping keeps it open. The list stays inside the profile so image and reel scroll containers cannot clip a floating popup. Each handle expands a small public bio, and character friends use mini portraits. Escape closes the friend list first, outside clicks dismiss it, and zero friends has an explicit empty state. There is no public enemies list or authoring-label badge.

### Verified character and institution cameos

Ten main-character accounts represent Jace, Gaelor, Visenor, Alester, Saera, Baelenys, Lorenah, Naella, Maela, and Saathos. `account: { type: "character", characterId }` binds each to the canonical character dataset; IDs must exist and each identity has only one account. A blue check is labeled "Verified character account" and the expanded profile explicitly identifies a fictional RP account. The canonical profile link and age come from existing character data and `computeAge`, rather than a separately maintained public age value.

Maela is a low-frequency background account: only one of her initial three comments remains (the height-discussion reply). Keep future appearances rare and directly relevant; do not routinely use her for royal or sibling banter. The `velvet_tax` fan can still discuss style and everyday topics without bringing Maela into every thread. This changes editorial emphasis, not canonical traits or relationships.

At the 14th day of the 8th moon, 99 AC, the voice references are Jace/Maela 17, Gaelor/Alester 18, Saera 19, Visenor 24, Saathos 25, Lorenah 16, Naella 15, Baelenys 58. Refresh authoring tone when the chronicle changes. Young characters have distinct voices; Alester is laconic, Jace quick and strategic, Gaelor impulsive, Lorenah calmly direct. Baelenys is formal and imposing. These are comic social-AU appearances, not newly canonized events or revelations. Do not expose Visenor's hidden identity/location, political secrets or unresolved relationships through public jokes.

`getGutterThreads` puts any root conversation containing a character at the top, preserving insertion order between equally pinned conversations and the order of replies inside them. A character replying to an ordinary user promotes that whole conversation and displays "Character replied". Every comment appears exactly once; its parent ID stays intact. No stored client-controlled `pinned` or `verified` flag is needed.

The Citadel raven desk and City Watch help desk use `account: { type: "institution", institutionId }`. `data/gutter-institutions.json` records the institutions and makes clear that their social desks/admins are comedic inventions. Their gold checks say "Verified institution account". They are occasional Gen Z staff voices; they do not leak confidential information, issue new canon policies or make civilian victims the joke. Institution-only conversations are not automatically pinned.

Keep thread lengths varied and character/institution cameos rare. There is no fixed five-comment minimum or mandatory fan budget. Validate all identities and replies using `validate:comments`. Browser checks cover pinned root comments, promoted ordinary conversations, canonical profile links, age, non-pinned institutions, and no duplicated comment rendering on mobile and desktop.

`kind: fictional | member`, independent author IDs, post IDs and parent IDs allow future storage to retain these threads alongside real members. This release has no authentication, member database or submission endpoint. When those arrive, resolve author identity on the server; never trust a client-supplied author ID. Fictional authors must remain distinguishable from registered members.

Removing a gallery entry also requires explicitly removing its thread, or migrating it with a deliberate ID mapping. Validation rejects orphaned comments and uncovered posts. Admin publishing does not generate comments: the agreed workflow is AI-assisted content editing in the repository.
