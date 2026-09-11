"use client";
import {useState} from "react";
import Link from "next/link";
import MiniPortrait from "@/components/MiniPortrait";
import type {AffinityField} from "@/lib/profileAffinity";
import {createClient} from "@/lib/supabase/client";
import styles from "@/app/users/[username]/profile.module.css";
export default function ProfileAffinity({profileId,values,catalog,editable=false}:{profileId:string;values:Record<string,string>;catalog:AffinityField[];editable?:boolean}){
 const [selected,setSelected]=useState(values),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function save(){setBusy(true);const {error}=await createClient().from('profiles').update({affinity:selected}).eq('id',profileId);setMessage(error?'Affinity could not be saved.':'Affinity updated.');setBusy(false);}
 return <section className={styles.friends}><h2>Affinity</h2>{catalog.map(field=>{const item=field.options.find(o=>o.id===selected[field.key]);return <div key={field.key} className={styles.activityCard}><h3>{field.label}</h3>{editable&&<select aria-label={field.label} value={selected[field.key]??''} disabled={busy} style={{width:'100%',minWidth:0}} onChange={e=>setSelected(v=>({...v,[field.key]:e.target.value}))}><option value="">Not selected</option>{field.options.map(o=><option key={o.id} value={o.id}>{o.title}</option>)}</select>}{item?<Link href={item.href}>{item.portrait&&<MiniPortrait id={item.portrait} alt="" size={44}/ >}{item.image&&<img src={item.image} alt="" style={{width:100,height:80,objectFit:'contain'}}/>}<p>{item.title}</p></Link>:<p>Not selected</p>}</div>})}{editable&&<button disabled={busy} onClick={()=>void save()}>Save affinity</button>}{message&&<p role="status">{message}</p>}</section>;
}
