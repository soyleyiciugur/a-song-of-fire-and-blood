"use client";
import CardsSelect from "@/components/the-great-game/CardsSelect";
import {useEffect,useState} from 'react';
import controls from '@/components/the-great-game/CardsControls.module.css';
import Link from 'next/link';
import styles from './ranks.module.css';
type Period={id:string;stage:string;name:string;displayName:string;start:string|null;end:string|null};
type SeasonView={period:Period;current:string|null;available:Period[];standings:{userId:string;username:string|null;name:string;rank:number;points:number;games:number;wins:number;losses:number;draws:number}[]};
export default function Seasons(){
  const [season,setSeason]=useState('');const [view,setView]=useState<SeasonView|null>(null);const [error,setError]=useState('');const [retry,setRetry]=useState(0);const [loading,setLoading]=useState(true);
  useEffect(()=>{const controller=new AbortController();async function load(){setLoading(true);setError('');try{const response=await fetch('/api/great-game/seasons'+(season?'?season='+encodeURIComponent(season):''),{signal:controller.signal,cache:'no-store'});const payload=await response.json();if(!response.ok)throw Error(payload.error||'The season could not be loaded.');if(!controller.signal.aborted)setView(payload);}catch(error){if(!controller.signal.aborted)setError(error instanceof Error?error.message:'The season could not be loaded.');}finally{if(!controller.signal.aborted)setLoading(false);}}void load();return()=>controller.abort();},[season,retry]);
  return <section className={styles.historyPanel} aria-label="Seasons"><h2>Seasons</h2><p>Crown standings by net rating gained within the selected season. Season changes require an explicit announcement; overall rating and tier are preserved. Equal points are ordered by wins; equal records share a rank.</p>
    {view&&<label className={`${controls.field} ${styles.seasonChooser}`}>Season <CardsSelect ariaLabel="Season" value={season||view.period.id} onChange={setSeason} options={view.available.map(period=>({value:period.id,label:period.stage+" — "+period.name+(period.id===view.current?" — Current":"")}))} /></label>}
    {loading?<p role="status">Opening the season ledger...</p>:error?<p role="alert">{error} <button className={controls.button} onClick={()=>setRetry(n=>n+1)}>Retry</button></p>:view&&<>
      <h3>{view.period.displayName}</h3><p>{view.period.end?'Closed on '+new Date(view.period.end).toLocaleDateString('en-GB',{timeZone:'Europe/Istanbul'}):'Active until an explicitly announced transition. No scheduled reset.'} Matches retain the season in which their table opened.</p>
      {!view.standings.length?<p>No completed matches in this season yet.</p>:<ol className={styles.historyList}>{view.standings.map(row=><li key={row.userId}><div><strong>#{row.rank} {row.username?<Link href={'/users/'+encodeURIComponent(row.username)}>{row.name}</Link>:row.name}</strong><span>{row.games} matches · {row.wins}W / {row.losses}L / {row.draws}D</span></div><div className={styles.historyRating}><strong>{row.points>0?'+':''}{row.points}</strong><small>season points</small></div></li>)}</ol>}
      <p className={styles.historyNote}>All earlier Crown matches belong to Alpha Season — The First Embers. Friendly Games do not count. Past standings are calculated from retained results; corrected results also update this ledger. Abandoned matches count as losses.</p>
    </>}
  </section>;
}
