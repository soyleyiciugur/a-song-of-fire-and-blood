"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {seasonDisplayName,type Season} from '@/lib/the-great-game/seasons';
import styles from './play-hub.module.css';
export default function SeasonReference({season}:{season?:Season|null}){
 const [loaded,setLoaded]=useState<Season|null>(null);
 useEffect(()=>{if(season)return;const controller=new AbortController();fetch('/api/great-game/seasons?summary=1',{signal:controller.signal,cache:'no-store'}).then(async response=>{if(response.ok){const data=await response.json();if(!controller.signal.aborted)setLoaded(data.season??null);}}).catch(()=>{});return()=>controller.abort();},[season]);
 const current=season??loaded;return current?<Link href="/cards/ranks" className={styles.seasonReference}>{seasonDisplayName(current)}</Link>:null;
}
