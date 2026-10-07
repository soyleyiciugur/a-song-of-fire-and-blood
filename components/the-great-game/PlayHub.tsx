"use client";
import Link from "next/link";
import { Suspense } from "react";
import type { StoredDeck } from "@/lib/the-great-game/stored-decks";
import type { GreatGameOnlineMatchSummary, GreatGameOnlineMatchView } from "@/lib/the-great-game/online";
import HubFriends from "./HubFriends";
import { useHubData } from "./useHubData";
import ParchmentDialog, { ParchmentNote } from "./ParchmentDialog";
import styles from "./play-hub.module.css";
import JoinInvitation from "./JoinInvitation";
import HubNavFrame from "./HubNavFrame";
import InnQuote from "./InnQuote";

export function CupIcon() {
  return <svg viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M9 3h14v8c0 6-3 9-7 9s-7-3-7-9V3Z" fill="currentColor"/><path d="M9 5H4v5c0 4 3 6 7 6M23 5h5v5c0 4-3 6-7 6M16 20v9m-7 4h14l-4-4h-6l-4 4Z" stroke="currentColor" strokeWidth="2"/></svg>;
}

export default function PlayHub(props: {
  onNewGame: () => void; onlineOpen: boolean; onToggleOnline: () => void;
  decks: StoredDeck[]; deckId: string; onDeckChange: (value: string) => void;
  code: string; onCodeChange: (value: string) => void; onlineBusy: boolean; onlineError: string | null;
  matches: GreatGameOnlineMatchSummary[]; onCreateOnline: () => void; onJoinOnline: () => void;
  onResumeOnline: (id: string) => void; onInvited: (match: GreatGameOnlineMatchView) => void;
}) {
  const { data, error, guest } = useHubData();
  const last = data?.lastMatch;
  return <main className={styles.hub} data-great-game-hub>
    <Suspense fallback={null}><JoinInvitation onCode={props.onCodeChange} onOpen={props.onToggleOnline} open={props.onlineOpen} /></Suspense>
    <HubNavFrame active="play" data={data} guest={guest} showSign />
    <div className={styles.content}>
      <section className={styles.intro} aria-labelledby="play-heading">
        <span className={styles.eyebrow}>The Great Game</span><h1 className={styles.title} id="play-heading">Play</h1>
        <h2>A table always awaits</h2><InnQuote kind="welcome" className={styles.description} />
        <div className={styles.actions}><button type="button" onClick={props.onToggleOnline} aria-expanded={props.onlineOpen}>Challenge a Friend <span aria-hidden="true">⚔</span></button><button type="button" onClick={props.onNewGame}>Local Game <span aria-hidden="true">›</span></button></div>
        {!props.onlineOpen && props.onlineError && <p role="alert">{props.onlineError}</p>}
      </section>
      <div className={styles.socialColumn}>
        <HubFriends data={data} guest={guest} error={error} decks={props.decks} deckId={props.deckId} onDeckChange={props.onDeckChange} onInvited={props.onInvited} />
        <section className={styles.recap} aria-label="Last match recap"><div className={styles.panelHeading}><h2>Last match</h2><CupIcon /></div>
          {last ? <div className={styles.recapBody}><strong data-result={last.result}>{last.result === "win" ? "Victory" : last.result === "draw" ? "Draw" : "Defeat"}</strong><p>Against {last.opponent_display_name || last.opponent_username}</p><small>{last.turns} turns · {Math.floor(last.duration_seconds / 60)}m {last.duration_seconds % 60}s · {last.rating_after - last.rating_before >= 0 ? "+" : ""}{last.rating_after - last.rating_before} rating</small><InnQuote kind={last.result === "abandon" ? "loss" : last.result} className={styles.voice} /></div>
            : error ? <p className={styles.empty}>The last match could not be loaded.</p> : <InnQuote kind="empty" className={styles.empty} />}
        </section>
      </div>
    </div>
    <footer className={styles.footer}><span>Strength wins battles. Influence wins realms.</span></footer>
    {props.onlineOpen && <ParchmentDialog title="A table for two" onClose={() => { if (!props.onlineBusy) props.onToggleOnline(); }}>
      <ParchmentNote speaker="aldren">Choose your deck, my liege. Open a table for a friend, or bring their invitation here.</ParchmentNote>
      <div className={styles.inviteForm}>
        <label>Your deck<select value={props.deckId} onChange={event => props.onDeckChange(event.target.value)} disabled={props.onlineBusy}>{!props.decks.some(deck => deck.id === "practice") && <option value="practice">Practice Deck</option>}{props.decks.map(deck => <option key={deck.id} value={deck.id}>{deck.name}</option>)}</select></label>
        <button type="button" className={styles.primary} onClick={props.onCreateOnline} disabled={props.onlineBusy}>{props.onlineBusy ? "Preparing the table…" : "Open a Table"}</button>
        <span className={styles.divider}>Already invited?</span>
        <form className={styles.joinRow} onSubmit={event => { event.preventDefault(); if (props.code.length === 6 && !props.onlineBusy) props.onJoinOnline(); }}><label className={styles.srOnly} htmlFor="table-code">Table code</label><input id="table-code" value={props.code} onChange={event => props.onCodeChange(event.target.value)} placeholder="TABLE CODE" maxLength={6} autoCapitalize="characters" autoComplete="off" spellCheck={false} disabled={props.onlineBusy} /><button className={styles.primary} disabled={props.onlineBusy || props.code.length !== 6}>Join</button></form>
        {props.onlineError && <p role="alert">{props.onlineError}{props.onlineError.toLowerCase().includes("sign in") && <> <Link href="/login">Sign in</Link></>}</p>}
        {!!props.matches.length && <div className={styles.resumeList}><span>Open tables</span>{props.matches.map(match => <button type="button" key={match.id} disabled={props.onlineBusy} onClick={() => props.onResumeOnline(match.id)}>{match.status === "waiting" ? "Your reserved table" : `vs. ${match.opponent?.displayName || "Opponent"}`}<b>{match.code}</b></button>)}</div>}
      </div>
    </ParchmentDialog>}
  </main>;
}
