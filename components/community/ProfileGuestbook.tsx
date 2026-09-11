"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/users/[username]/profile.module.css";

type Entry={id:string;author_id:string;body:string;created_at:string};

export default function ProfileGuestbook({profileId,viewerId,canModerate=false}:{profileId:string;viewerId:string|null;canModerate?:boolean}) {
 const db=useMemo(()=>createClient(),[]),lock=useRef(false);
 const [rows,setRows]=useState<Entry[]>([]),[people,setPeople]=useState<Record<string,{username:string;display_name:string;avatar_url:string|null}>>({}),[body,setBody]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[page,setPage]=useState(0),[more,setMore]=useState(false),[revision,setRevision]=useState(0);
 useEffect(()=>{let active=true;void (async()=>{const {data,error}=await db.from("profile_guestbook").select("*").eq("profile_id",profileId).order("created_at",{ascending:false}).order("id").range(page*20,page*20+19);if(!active)return;if(error){setError("Guestbook could not be loaded.");return;}const entries=data as Entry[];const ids=[...new Set(entries.map(r=>r.author_id))];const result=ids.length?await db.from("profiles").select("id,username,display_name,avatar_url").in("id",ids):{data:[]};if(active){setRows(old=>page===0?entries:[...old,...entries]);setPeople(old=>({...old,...Object.fromEntries((result.data??[]).map(p=>[p.id,p]))}));setMore(entries.length===20);}})();return()=>{active=false};},[db,profileId,page,revision]);
 async function submit(event:React.FormEvent){event.preventDefault();if(lock.current||!viewerId||!body.trim())return;lock.current=true;setBusy(true);setError("");try{const {error}=await db.from("profile_guestbook").insert({profile_id:profileId,author_id:viewerId,body:body.trim()});if(error)throw error;setBody("");setPage(0);setRevision(v=>v+1);}catch{setError("Your message could not be saved. Try again.");}finally{lock.current=false;setBusy(false);}}
 async function remove(id:string){const {error}=await db.from("profile_guestbook").delete().eq("id",id);if(error)setError("Could not delete this entry.");else setRows(rows=>rows.filter(r=>r.id!==id));}
 return <section className={styles.friends}>
   <div className={styles.friendHeader}><div><span className={styles.guestbookEyebrow}>Public messages</span><h2>Guestbook</h2></div><small>{rows.length ? `${rows.length}${more?"+":""} entries` : "No entries yet"}</small></div>
   <div className={styles.guestbookList}>{rows.map(row=>{const person=people[row.author_id];return <article className={`${styles.activityCard} ${styles.guestbookEntry}`} key={row.id}><div className={styles.guestbookRow}>{person&&<Link className={styles.guestbookAvatar} href={`/users/${person.username}`} aria-label={`${person.display_name} profile`}>{person.avatar_url?<img src={person.avatar_url} alt=""/>:<span>{person.display_name.slice(0,2).toUpperCase()}</span>}</Link>}<div className={styles.guestbookBody}><div className={styles.guestbookMeta}>{person&&<Link href={`/users/${person.username}`}>{person.display_name}</Link>}<small>{new Date(row.created_at).toLocaleDateString("en-GB")}</small></div><p>{row.body}</p>{viewerId&&(viewerId===row.author_id||viewerId===profileId||canModerate)&&<button className={styles.guestbookDelete} onClick={()=>void remove(row.id)}>Delete</button>}</div></div></article>})}</div>
   {more&&<button className={styles.guestbookMore} onClick={()=>setPage(p=>p+1)}>Load more</button>}
   {viewerId&&viewerId!==profileId&&<form className={styles.guestbookComposer} onSubmit={submit}>
      <div className={styles.guestbookComposerHead}><div><span className={styles.guestbookEyebrow}>Leave your mark</span><h3>Write in this guestbook</h3></div><span className={styles.guestbookCount}>{body.length}/500</span></div>
      <textarea aria-label="Guestbook message" required maxLength={500} placeholder="Leave a public message..." value={body} onChange={e=>setBody(e.target.value)} />
      <div className={styles.guestbookComposerFoot}><span>Visible to everyone who visits this profile.</span><button disabled={busy||!body.trim()}>{busy?"Posting…":"Leave message"}</button></div>
   </form>}
   {!viewerId&&<Link className={styles.guestbookSignIn} href="/login">Sign in to leave a message</Link>}
   {error&&<p className={styles.guestbookError} role="status">{error}</p>}
 </section>;
}
