"use client";
import {useState} from 'react';
import type {Database} from '@/lib/supabase/database.types';
import type {MatchScope} from '@/lib/the-great-game/match-types';
import controls from './CardsControls.module.css';
import styles from './MatchTypeStats.module.css';
type Row=Database['public']['Views']['great_game_type_stats']['Row'];
export default function MatchTypeStats({rows}:{rows:Row[]}) {
 const [scope,setScope]=useState<MatchScope>('total');const row=rows.find(r=>r.match_type===scope);
 return <section className={styles.record} aria-label="Match statistics by type"><nav className={controls.tabs} aria-label="Match statistics">{(['total','custom','ranked'] as const).map(type=><button key={type} aria-pressed={scope===type} onClick={()=>setScope(type)}>{type==='total'?'Total':type==='custom'?'Friendly':'Crown'}</button>)}</nav><dl>{[['Matches',row?.games_played??0],['Wins',row?.wins??0],['Losses',row?.losses??0],['Draws',row?.draws??0],['Win rate',row?.games_played?row.win_rate+'%':'—']].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><small>Abandoned games count as losses. Only Crown Games affect rating and seasons.</small></section>;
}
