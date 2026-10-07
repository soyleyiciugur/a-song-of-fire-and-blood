"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { SpectatorView } from "@/lib/the-great-game/spectator";
import { findGameCard } from "@/lib/the-great-game/cards";
import { GameCardFace, GameCardModal } from "@/components/cards/GameCardFace";
import type { GameCard } from "@/lib/the-great-game/types";
import styles from "./play-hub.module.css";

export default function SpectatorTable({ matchId }: { matchId: string }) {
  const [view, setView] = useState<SpectatorView | null>(null);
  const [error, setError] = useState("");
  const [card, setCard] = useState<GameCard | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const response = await fetch(`/api/great-game/spectate?match=${encodeURIComponent(matchId)}`, { cache: "no-store", signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) { setView(null); throw Error(payload.error || "The table could not be loaded."); }
        setView(payload); setError("");
        if (payload.status === "finished") return;
      } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "The table could not be loaded."); }
      if (!controller.signal.aborted) timer = setTimeout(refresh, 4000);
    }
    void refresh(); return () => { controller.abort(); clearTimeout(timer); };
  }, [matchId]);
  return <main className={`${styles.hub} ${styles.parchmentTable}`}>
    <section className={styles.spectator}>
      <header><div><span className={styles.eyebrow}>Watching a friend&apos;s table</span><h1>{view ? `${view.host} vs. ${view.guest}` : "The Cupbearer"}</h1></div><Link className={styles.secondary} href="/cards/play">Back to the inn</Link></header>
      {error && <p role="alert">{error}</p>}
      {!view && !error && <p role="status">Aldren is finding you a seat…</p>}
      {view && <>
        <p className={styles.spectatorStatus}>{view.state.winner ? view.state.winner === "draw" ? "A drawn game." : `${view.state.winner === "player1" ? view.host : view.guest} prevails.` : `Turn ${view.state.turnNumber} · ${view.state.activePlayerId === "player1" ? view.host : view.guest}'s turn`}</p>
        {(["player2", "player1"] as const).map(id => <section className={styles.spectatorPlayer} key={id} aria-label={id === "player1" ? view.host : view.guest}>
          <h2>{id === "player1" ? view.host : view.guest}<small>{view.state.players[id].standing} Standing · {view.state.players[id].command}/{view.state.players[id].maxCommand} Command · {view.state.players[id].handCount} in hand</small></h2>
          <div className={styles.spectatorBoard}>{view.state.players[id].board.map(unit => { const card = findGameCard(unit.cardId); return card ? <div key={unit.instanceId}><GameCardFace card={card} onSelect={() => setCard(card)} /><small>{unit.currentHealth} Health {unit.exhausted ? "· Exhausted" : ""}</small></div> : null; })}{!view.state.players[id].board.length && <p>No units at the table yet.</p>}</div>
        </section>)}
        <p className={styles.voice}>“Watch the table, my liege. A player&apos;s hand remains their own.” — Aldren</p>
      </>}
    </section>
    {card && <GameCardModal card={card} onClose={() => setCard(null)} />}
  </main>;
}
