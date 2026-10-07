"use client";
import { useState } from "react";
import type { GameState, PlayerId } from "@/lib/the-great-game/types";
import { playerSupporter } from "@/lib/the-great-game/supporters";
import { buildChronicle } from "@/lib/the-great-game/chronicle";
import ParchmentDialog, { ParchmentNote } from "./ParchmentDialog";
import styles from "./play-hub.module.css";

export default function MatchResult({ state, viewerId, winnerName, onPlayAgain, onExit }: { state: GameState; viewerId: PlayerId; winnerName: string; onPlayAgain: () => void; onExit: () => void }) {
  const [review, setReview] = useState(false);
  const result = state.winner === "draw" ? "Draw" : state.winner === viewerId ? "Victory" : "Defeat";
  const speaker = playerSupporter(state, viewerId);
  const copy = speaker === "mara"
    ? result === "Victory" ? "Well played. The next round of boasting is yours." : result === "Defeat" ? "A hard table. Catch your breath. There is another game in you." : "Neither of you would yield. Call it even; the fire is still warm."
    : result === "Victory" ? "A fine victory, my liege. The inn shall remember this one." : result === "Defeat" ? "Even a crown must weather a difficult evening, my liege. Your seat remains." : "An equal reckoning, my liege. Perhaps the next hand will settle it.";
  return <main className={`${styles.hub} ${styles.resultScreen}`}>
    <section className={styles.resultCard} data-result={result.toLowerCase()}>
      <div className={styles.victoryCrest}><svg viewBox="0 0 120 108" fill="none" aria-hidden="true">
        <path d="M54 97C19 89 8 55 29 21M66 97c35-8 46-42 25-76" stroke="currentColor" strokeWidth="1.5" />
        {[false, true].map(mirror => <g key={String(mirror)} transform={mirror ? "translate(120 0) scale(-1 1)" : undefined} fill="currentColor">
          <path d="M49 92c-10 1-17-2-19-9 9-1 16 2 19 9ZM38 86c-9-2-15-7-15-14 9 2 14 6 15 14ZM29 75c-8-4-12-10-10-17 8 3 12 9 10 17ZM23 62c-7-5-9-12-6-18 7 5 9 11 6 18ZM22 48c-5-6-5-13 0-18 5 6 5 12 0 18ZM26 34c-2-7 1-13 7-16 2 6-1 13-7 16Z" />
          <path d="M44 88c-1-8 1-13 7-16 2 8-1 13-7 16ZM33 78c-1-7 2-13 8-14 0 7-2 12-8 14ZM26 65c1-7 5-11 11-11-1 7-5 11-11 11ZM23 51c3-6 7-9 13-7-2 6-7 9-13 7ZM25 39c4-5 9-6 14-3-4 5-9 6-14 3Z" opacity=".75" />
        </g>)}
        <path d="M48 28h24v13c0 12-5 18-12 18s-12-6-12-18V28Z" fill="currentColor" />
        <path d="M48 31H39v8c0 8 5 12 12 12m21-20h9v8c0 8-5 12-12 12M60 59v16m-12 7h24l-8-7h-8Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="m60 92 4 5-4 5-4-5Z" fill="currentColor" />
      </svg></div>
      <span className={styles.eyebrow}>The Great Game</span><h1>{result}</h1>
      <p>{state.winner === "draw" ? "Neither claimant remains standing." : `${winnerName} prevails`}</p>
      <ParchmentNote speaker={speaker}>{copy}</ParchmentNote>
      <div className={styles.resultStats}><span><strong>{state.turnNumber}</strong>Turns</span><span><strong>{state.players[viewerId].standing}</strong>Your Standing</span></div>
      <div className={styles.resultActions}><button className={styles.secondary} onClick={() => setReview(true)}>View Chronicle</button><button className={styles.primary} onClick={onPlayAgain}>Play Again</button></div>
      <button className={styles.textButton} onClick={onExit}>Back to the inn</button>
    </section>
    {review && <ParchmentDialog title="The match chronicle" onClose={() => setReview(false)} wide><ol className={styles.resultChronicle}>{buildChronicle(state.log, viewerId).map(event => <li key={event.id}><small>Turn {event.turn}</small><strong>{event.title}</strong><span>{event.detail}</span></li>)}</ol></ParchmentDialog>}
  </main>;
}
