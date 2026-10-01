# TGG Gameplay Update — 2026-10-01

## Implemented in this patch

- Hull Bladesman remains the stable `harbor-cutthroat` card id and is Velaryon affiliated.
- All 13 agreed Locations are present in canonical card data and wired into the engine.
- Oldtown: first positive Character modifier each Ruler turn is amplified by +1 per positive stat in that modifier.
- Winterfell: previous-opponent-turn Character death enables the first Character conflict retaliation bonus.
- Starfall: first Character Military conflict each Ruler turn gets +1 Strength for that conflict.
- Driftmark: first Character deployed each Ruler turn gains Swift until end of turn.
- Storm's End: first Military win each Ruler turn restores 1 Standing.
- Highgarden: 2/4/6 retained-turn Influence gains; retained-turn progress resets when Highgarden leaves play; earned permanent Influence remains.
- Riverrun: defending Characters receive +1 Strength / +1 Influence for conflict calculation.
- Sunspear: first qualifying 3+ Military damage poisons; 1 damage after normal draw on each of the source Ruler's next 2 turns.
- Castle Black: Guard Characters get +1 bonus Health.
- Braavos: leaving >=1 Command banks +1 next-turn Command and can exceed the normal 10 cap.
- Tyrosh: end-turn discard/draw mini-mulligan, drawn card -1 Command while in hand, no use on consecutive own turns.
- Crownlands Champion and Grand Counselor auras are live.
- Ser Orwell Morrigen — Experience Triumphs is live.
- Bonus Health is a separate damage layer. Damage always consumes bonus Health before base Health. Aura removal removes only remaining bonus Health.
- Practice deck updated to a legal 30-card feature-coverage mirror deck with strong early curve, all major traits, Orwell, both aura cards, two Dragons, Events, Artifacts and 2 Locations.
- Duplicate cards.json copies removed from the working tree; canonical data is `data/the-great-game/cards.json`.

## Online-play latency changes

- Action hot path now selects only the match fields needed for engine resolution instead of `select("*")`.
- `stateOnly=1` refresh now selects only state/version/seat metadata.
- Version-conflict responses return a state patch directly; they no longer fetch profiles/full match view.
- Match-event insert is deferred with `after()` so the actor does not wait for that extra Supabase write.
- Realtime duplicate/stale events no longer cause redundant state refreshes once the client already has that version.
- `Server-Timing` is emitted on action responses (`auth`, `db-read`, `engine`, `db-write`, `total`) and on state-only reads (`db-state`) for production diagnosis.

## Validation performed

- Focused TypeScript compile for `engine.ts`, `cards.ts`, `deck.ts`, `types.ts`: PASS.
- Practice deck validation: 30 cards, legal: PASS.
- Generic stat-skeleton collisions: 0.
- Health-layer assertions: `3+1` with 1 damage -> `3+0`; with 2 damage -> `2+0`: PASS.
- Aura-removal assertions: remaining base Health is preserved: PASS.
- Highgarden replacement resets threshold progress but preserves earned permanent Influence: PASS.
- Braavos at 10 base Command reaches 11 next turn when banked: PASS.
- Tyrosh end-turn pending choice appears: PASS.
- Route/page syntax parse check: no TypeScript parse errors. Full Next compile was unavailable because extracted repo has no `node_modules`.

## Still data-only / not yet engine-implemented

The location/passive backlog discussed in chat is closed. However, the current card database contains a much larger later-added named-card set. The following abilities have card text in data but do not yet have a confirmed engine implementation. They were **not invented in this patch**, because several require new rules concepts or timing decisions.

- **Visenor Targaryen — Hidden Claim** (`arrival`): Visenor's Ruler draws 1 card. If Visenor's Ruler controls no other Targaryen Character, the card drawn this way costs 1 less Command until the end of that turn.
- **Jaery Targaryen — The People Have Suffered Enough** (`arrival`): Restore 3 Standing.
- **Baelor Targaryen — The Argumentative One** (`arrival`): The next Event the opposing Ruler plays costs 2 more Command.
- **Rhaella Targaryen — Dangerous Name** (`passive`): While Rhaella is Ready, the first enemy Political Conflict against you each turn has -2 Influence.
- **Maela Targaryen — Buried Secret** (`victory`): After Maela wins a Political Conflict against a Character, the opposing Ruler's next card costs 1 more Command.
- **Vahaemon Targaryen — Dark Sister's Legacy** (`arrival`): Choose an enemy Character. It cannot initiate a Political Conflict during that Character's Ruler's next turn.
- **Derrin Hightower — The Confession** (`fall`): Derrin's Ruler draws 2 cards. The opposing Ruler draws 1 card.
- **Visenya Targaryen — You Never Saw Me** (`victory`): After Visenya wins a Military Conflict against a Character, if this is her first deployment this game, she cannot be targeted by enemy Characters, Events, or abilities until the start of her Ruler's next turn.
- **Visenya Targaryen — Playing Her Own Game** (`end-of-turn`): At the end of her Ruler's 3rd turn with Visenya in play, if she is still in play, return her to her Ruler's hand. This ability can trigger only once per game.
- **Lorenah Dayne — Starfall's Shadow** (`passive`): While Lorenah is in play, other Characters ruled by her Ruler cannot be targeted by enemy Events.
- **Naella Velaryon — Our Fleet Is Yours** (`arrival`): Summon two 1/0/1 Velaryon Sailors ruled by Naella's Ruler. While Driftmark is the active Location, Velaryon Sailors have +1 Strength.
- **Berholt Caswell — The Gods Will Judge** (`fall`): Restore 3 Standing.
- **Vhaemys Targaryen — Dreams of Things to Come** (`arrival`): Look at the top 3 cards of the opposing Ruler's deck. Vhaemys's Ruler may put one of them on the bottom of that deck. Return the others in the same order.
- **Ser Saathos Maris — Innkeeper! Another!** (`passive`): Adjacent Characters have +1 Health while Saathos is in play.
- **Steffon Baratheon — A Baratheon Kneels When He Feels Safe** (`passive`): Steffon's Strength and Influence cannot be reduced by enemy effects.
- **Ser Brant Costayne — Knights of Oldtown** (`fall`): Other Characters ruled by Brant's Ruler gain +1 Strength until the end of Brant's Ruler's next turn.
- **Melessa Hightower — The Last Name Standing** (`passive`): Other Hightower Characters ruled by Melessa's Ruler have +1 Influence.
- **Godfrey Blackwood — Gracious in Defeat** (`fall`): Deal 2 damage to enemy Standing.
- **Rickard Stark — When People Look Up** (`passive`): Adjacent Characters have +1 Influence while Rickard is in play.
- **Timos Hightower — He Asked for Parley** (`fall`): Characters ruled by Timos's Ruler gain +1 Strength until the end of Timos's Ruler's next turn. If Timos was destroyed in a Military Conflict, they gain +2 Strength instead.
- **Baran Strong — Seven Feet of Grievance** (`passive`): The first time Baran takes Military damage each turn, if he survives that damage, he gains +2 Strength until the end of the turn.
- **Clarisse Flowers — I'm No Knight nor Lady** (`passive`): The first time Clarisse survives damage from a Military Conflict each turn, she gains +1 Strength permanently.
- **Curtass Whent — They Pass Over Real Men** (`passive`): Curtass has +2 Strength while in a Military Conflict against a Character with Guard or Challenge.
- **Ser Brannyn Vance — I Cannot Draw Steel Against Royal Blood** (`passive`): Ser Brannyn Vance cannot initiate a Military Conflict against a Targaryen Character. When defending against a Military Conflict initiated by a Targaryen Character, Ser Brannyn Vance deals no Military damage back.
- **Malaenar Targaryen — Dragonstone's Quiet** (`passive`): While Dragonstone is the active Location, Units ruled by Malaenar's current Ruler have +1 Health.
- **Tansy Riverside — She Organized the Whole Thing** (`arrival`): The next Event Tansy's Ruler plays this turn costs 1 less Command.
- **Naela Targaryen — Whereabouts Unknown** (`passive`): While Naela is Ready, she cannot be targeted by enemy Events.
- **Brandon Stark — Death in His Own Bed** (`arrival`): Choose a Stark or Targaryen Character ruled by Brandon's Ruler. It gains +1 Influence permanently.
- **Tion Lannister — Deal With the Money** (`passive`): The first Event or Location you play each turn costs 1 less Command.
- **Martyn Mullendore — Safe Passage** (`arrival`): Choose another Character ruled by Martyn's Ruler. Enemy Characters cannot initiate Conflicts against it until the start of Martyn's Ruler's next turn.
- **Leo Tyrell — Proud of His Name** (`passive`): Whenever you deploy Visenor Targaryen, another Tyrell Character, or a Hightower Character, Leo gains +1 Influence permanently.
- **Almar Larchmont — Do Not Forget It, My Lady** (`passive`): The first time another Character ruled by Almar's Ruler would receive a negative stat modifier each turn, prevent that modifier.
- **Edmyn Uller — They Are Utterly Fucked** (`arrival`): Look at the top 3 cards of Edmyn's Ruler's deck. Put one into that Ruler's hand and put the rest on the bottom of that deck in any order.
- **Alysanne Hightower — Unintended** (`fall`): The Character that destroyed Alysanne gets -2 Influence permanently.
- **Perric Bracken — An Unfortunate Accident** (`passive`): The first time Perric would take damage from an Event each turn, prevent 2 of that damage.
- **Clover Tully — A Drunken Mistake** (`arrival`): Restore 2 Standing to both Rulers. Then Clover's Ruler draws 1 card.
- **Benjen Stark — Winter's Welcome** (`arrival`): When Benjen arrives, another Stark Character gains +1 Strength this turn.
- **Mother Marya — A Moment of Sight** (`arrival`): Look at the top 3 cards of your deck. Put one into your hand and the rest back in any order.
- **Annara Celtigar — A Friend Summoned** (`arrival`): If Vhaemys Targaryen is in play, both Characters gain +1 Influence.
- **Daria Sand — Seen From the Doorway** (`arrival`): Reveal one random card from an opponent's hand.
- **Ser Myles Mooton — Pull Him Clear** (`arrival`): Prevent 2 damage to another allied Character.
- **Ser Grance Morrigen — Hold Fast** (`arrival`): Grance gains +2 Health while defending.
- **Drack Harlaw — Pay the Iron Price** (`arrival`): After Drack wins a Conflict, his Ruler gains 1 Command.
- **Zekar Alasyr — Read the Crowd** (`arrival`): After an opponent plays an Event, Zekar gains +2 Influence this turn.
- **Mydan Gerren — The Stage Remains** (`arrival`): When another allied Character falls, draw 1 card.
- **Merryn Whitespring — Perfect Timing** (`arrival`): The next Event played by Merryn's Ruler costs 1 less Command.
- **Ser Lucas Corbray — Quiet Protection** (`arrival`): The weakest allied Character cannot be targeted by enemy abilities this turn.
- **Reyenald Reyne — Promising Blade** (`arrival`): Whenever Reyenald survives a Conflict, he gains +1 Strength permanently.
- **Ser Oswald Eagle — Before Dawn** (`arrival`): Exhaust an enemy Character involved in the last Conflict.
- **Nymos — Guarded Questions** (`arrival`): Look at one random card in an opponent's hand, then draw and discard a card.
- **Liana Tyrell — Know When Enough Is Enough** (`arrival`): Prevent an allied Character from losing Influence this turn.
- **Elinor Tyrell — Golden Rose Brooch** (`arrival`): Give another allied Character +2 Influence while Elinor remains in play.
- **Darren Dayne — Starfall's Shelter** (`arrival`): Prevent the first 2 damage dealt to another allied Character each turn.
- **Aenys Targaryen II — A Crown of Command** (`arrival`): Other Targaryen Characters gain +1 Influence and cannot retreat voluntarily.
- **Vhaemys Targaryen — Endure the Crown** (`arrival`): Whenever another allied Character loses Influence, Vhaemys gains 1 Influence.
- **Alysa Targaryen — Dragonstone Household** (`arrival`): The first Targaryen Character deployed after Alysa costs 1 less Command.
- **Vaenarr Targaryen — Blood of the Crown** (`arrival`): Vaenarr gains +1 Strength and Influence while another Targaryen is in play.
- **Tygett Lannister — The Lion's Levy** (`arrival`): Gain 1 Command whenever a Location enters play under your control.
- **Ella Lannister — Western Court** (`arrival`): Choose an allied Lannister Character to gain +2 Influence this turn.
- **Myrielle Marbrand — Ember of Ashemark** (`arrival`): Deal 1 damage to a Character that reduces Myrielle's Influence.
- **Harrik Greyjoy — Ironborn Defiance** (`arrival`): After Harrik wins a Conflict, discard the top card of the defeated Ruler's deck.
- **Maron Dayne — A Father's Legacy** (`arrival`): When Maron falls, another Dayne Character gains +2 Strength permanently.
- **Lyarra Karstark — North and Dorne** (`arrival`): Lyarra counts as both a Stark and Dayne ally for abilities.
- **Elwood Tully — The Next Lord** (`arrival`): Whenever a Tully Location enters play, Elwood gains +1 Influence.
- **Oscar Tully — River Knight** (`arrival`): Oscar gains +2 Strength while defending a Tully Character.
- **Bethany Bracken — Guard the Household** (`arrival`): Prevent an allied Bracken Character from being exhausted.
- **Ronnel Arryn — The Eyrie's Pride** (`arrival`): Enemy Characters with less Influence cannot challenge Ronnel directly.
- **Edwyle Stark — A Debt Remembered** (`arrival`): When Edwyle falls, draw 2 cards and restore 2 Standing.
- **Nymor Martell — Dornish Patience** (`arrival`): The first hostile Event played against Nymor each round has no effect.
- **Meria Martell — Unbowed Counsel** (`arrival`): Allied Martell Characters cannot lose Influence during the round Meria arrives.
- **Alyssa Velaryon — Tides of Court** (`arrival`): Move 1 Influence from an enemy Character to an allied Velaryon Character.