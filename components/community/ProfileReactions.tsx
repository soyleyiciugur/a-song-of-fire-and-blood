"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "@/lib/supabase/client";
import styles from "@/app/users/[username]/profile.module.css";
type Reaction={target_kind:string;target_id:string;direction:string;total:number;latest:string;href:string};
export default function ProfileReactions({userId}:{userId:string}){
 const [rows,setRows]=useState<Reaction[]>([]),[error,setError]=useState('');
 useEffect(()=>{let active=true;void createClient().rpc('profile_reactions',{member_id:userId}).then(({data,error})=>{if(active){if(error)setError('Reactions could not be loaded.');else setRows(data??[]);}});return()=>{active=false};},[userId]);
 return <section className={styles.activity}><h2>Recent Likes &amp; Favor</h2>{rows.map(r=><article key={`${r.target_kind}-${r.target_id}-${r.direction}`} className={styles.activityCard}><Link href={r.href}>{r.total} {r.target_kind==='raven'?'Like':'Favor'} {r.direction==='received'?'Received':'Given'} · {r.target_kind==='raven'?"Raven’s Eye comment":r.target_kind==='thread'?'Forum thread':'Forum post'}</Link><small> · {new Date(r.latest).toLocaleDateString('en-GB')}</small></article>)}{!rows.length&&!error&&<p>No recent reactions.</p>}{error&&<p role="status">{error}</p>}</section>;
}
