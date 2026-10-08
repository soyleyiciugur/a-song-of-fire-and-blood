"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import type {SpectatorView} from "@/lib/the-great-game/spectator";
import GreatGameTable from "./GreatGameTable";
import styles from "./play-hub.module.css";
export default function SpectatorTable({matchId}:{matchId:string}) {
  const [view,setView]=useState<SpectatorView|null>(null);
  const [error,setError]=useState("");
  useEffect(()=>{
    const controller=new AbortController(); let timer:ReturnType<typeof setTimeout>;
    async function refresh(){
      try {
        const response=await fetch(`/api/great-game/spectate?match=${encodeURIComponent(matchId)}`,{cache:"no-store",signal:controller.signal});
        const payload=await response.json();
        if(!response.ok){if([401,403,404].includes(response.status))setView(null);throw Error(payload.error || "The table could not be loaded.");}
        if(controller.signal.aborted)return;
        setView(previous=>previous && previous.match.version===payload.match.version && previous.match.status===payload.match.status && previous.match.state?.winner===payload.match.state?.winner ? previous : payload);setError("");
        if (payload.match.status === "finished" || payload.match.status === "abandoned" || payload.match.state?.winner) return;
      }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Connection interrupted.");}
      if(!controller.signal.aborted)timer=setTimeout(refresh,document.hidden?8000:1500);
    }
    void refresh();return ()=>{controller.abort();clearTimeout(timer);};
  },[matchId]);
  if(view && (view.match.status === "finished" || view.match.status === "abandoned" || view.match.state?.winner)) {
    const winner = view.match.state?.winner;
    const winnerName = winner === "player1" ? view.match.host.displayName : view.match.guest?.displayName;
    return <main className={styles.hub + " " + styles.resultScreen}><section className={styles.resultCard}>
      <span className={styles.eyebrow}>Spectating ended</span>
      <h1>{winner === "draw" ? "Draw" : "Match ended"}</h1>
      <p>{winner && winner !== "draw" ? winnerName + " prevails." : winner === "draw" ? "The table ends in a draw." : "The players have left the table."}</p>
      <Link className={styles.primary} href="/cards/play">Back to the inn</Link>
    </section></main>;
  }
  if(view)return <><GreatGameTable spectator={view}/>{error&&<div className={styles.spectatorConnection} role="status">{error} Reconnecting…</div>}</>;
  return <main className={`${styles.hub} ${styles.parchmentTable}`}><section className={styles.waiting}><h1>Watch the table</h1><p role="status">{error||"Taking a seat in the gallery…"}</p><Link href="/cards/play" className={styles.secondary}>Back to the inn</Link></section></main>;
}
