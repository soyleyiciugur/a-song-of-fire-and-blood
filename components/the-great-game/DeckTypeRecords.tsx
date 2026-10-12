"use client";
import {useState} from 'react';
import type {Database} from '@/lib/supabase/database.types';
import type {MatchScope} from '@/lib/the-great-game/match-types';
import controls from './CardsControls.module.css';
import styles from '@/app/users/[username]/profile.module.css';
type Row=Database['public']['Views']['great_game_deck_type_stats']['Row'];
export default function DeckTypeRecords({rows}:{rows:Row[]}){
 const [scope,setScope]=useState<MatchScope>('total');const records=rows.filter(row=>row.match_type===scope).sort((a,b)=>b.games_played-a.games_played).slice(0,6);
 return <div className={styles.gameDetail}><h3>Deck &amp; Faction Record</h3><nav className={controls.tabs} aria-label="Profile deck statistics">{(['total','custom','ranked'] as const).map(type=><button key={type} aria-pressed={scope===type} onClick={()=>setScope(type)}>{type.charAt(0).toUpperCase()+type.slice(1)}</button>)}</nav>{records.map(row=><div className={styles.gameRow} key={row.deck_name+':'+row.faction}><span><strong>{row.deck_name}</strong><small>{row.faction} · {row.games_played} games · {row.win_rate}% wins</small></span><b>{row.wins}W · {row.losses}L · {row.draws}D</b></div>)}{!records.length&&<p>No {scope} deck results yet.</p>}</div>;
}
