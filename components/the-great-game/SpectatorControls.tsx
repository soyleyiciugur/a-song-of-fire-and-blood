"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import type {PlayerId} from "@/lib/the-great-game/types";
import type {GreatGameOnlineMatchView} from "@/lib/the-great-game/online";
import styles from "@/app/cards/play/play.module.css";
export default function SpectatorControls({match,side,watching,onChange}:{match:GreatGameOnlineMatchView;side:PlayerId|"director";watching:PlayerId;onChange:(side:PlayerId|"director")=>void}) {
  const name=(watching==="player1"?match.host:match.guest)?.displayName || "Player";
  const [notice,setNotice]=useState(false);
  useEffect(()=>{
    const show=setTimeout(()=>setNotice(true),120);
    const hide=setTimeout(()=>setNotice(false),2100);
    return ()=>{clearTimeout(show);clearTimeout(hide);};
  },[watching]);
  return <nav className={styles.spectatorControls} aria-label="Spectator controls" data-selection-ui="true">
    <div className={styles.spectatorIdentity}><small>Spectator</small><strong>Watching {name}</strong></div>
    <div className={styles.spectatorSides} role="group" aria-label="Viewpoint">
      <button aria-pressed={side==="player1"} onClick={()=>onChange("player1")}>{match.host.displayName}</button>
      <button aria-pressed={side==="player2"} onClick={()=>onChange("player2")}>{match.guest?.displayName}</button>
    </div>
    <button className={styles.spectatorDirector} aria-pressed={side==="director"} onClick={()=>onChange("director")}>Auto director</button>
    <Link href="/cards/play">Leave</Link>
    {notice&&<div key={watching} className={styles.watchingNotice} role="status">Watching {name}</div>}
  </nav>;
}
