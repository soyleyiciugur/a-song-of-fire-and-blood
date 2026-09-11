"use client";

import Link from "next/link";
import { refreshCommunity, useCommunity } from "@/lib/communityStore";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadLikeState } from "@/lib/memberLikes";
import styles from "./composer.module.css";

type Reactor = { username:string; display_name:string; avatar_url?:string|null; href?:string; initials?:string };

export default function LikeButton({ kind, id, legacyReactorIds = [] }: { kind:"thread"|"post"|"raven"|"message"; id:string; legacyReactorIds?:string[] }) {
  const favor = kind === "thread" || kind === "post";
  const supabase = useMemo(() => createClient(), []);
  const community = useCommunity();
  const [people,setPeople] = useState<Reactor[]|null>(null);
  const [memberCount,setMemberCount] = useState(0);
  const [liked,setLiked] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const legacyPeople = useMemo(() => legacyReactorIds.map(id => community.users.find(user => user.id === id)).filter(Boolean), [community.users, legacyReactorIds]);
  const count = memberCount + legacyPeople.length;

  useEffect(()=>{let active=true;const refresh=()=>{if(document.visibilityState!=="visible")return;void loadLikeState(kind,id).then(state=>{if(active){setMemberCount(state.count);setLiked(state.liked);}}).catch(()=>{});};refresh();const timer=setInterval(refresh,15000);return()=>{active=false;clearInterval(timer);};},[id,kind]);
  useEffect(()=>{if(!people)return;const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setPeople(null);};document.addEventListener("keydown",close);return()=>document.removeEventListener("keydown",close);},[people]);

  async function showPeople(){
    if(people){setPeople(null);return;} setError("");
    const {data,error:likesError}=await supabase.from("member_likes").select("user_id").eq("target_kind",kind).eq("target_id",id);
    if(likesError){setError("Could not load reactions.");return;}
    const ids=(data??[]).map(row=>row.user_id);
    const result=ids.length?await supabase.from("profiles").select("username,display_name,avatar_url").in("id",ids):{data:[] as Reactor[],error:null};
    if(result.error){setError("Could not load reactions.");return;}
    const members=((result.data??[]) as Reactor[]).map(person=>({...person,href:`/users/${person.username}`}));
    const legacy:Reactor[]=legacyPeople.map(user=>({username:user!.username,display_name:user!.displayName??user!.username,avatar_url:user!.avatarUrl,href:user!.profileHref,initials:user!.avatar}));
    setPeople([...legacy,...members]);
  }

  async function toggle(){
    setBusy(true); setError("");
    try {
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){setError(favor?"Sign in to grant Favor.":"Sign in to like.");return;}
      const {error:saveError}=await supabase.rpc("toggle_member_reaction",{kind,target:id});
      if(saveError){console.error("Reaction save failed",{kind,id,saveError});throw saveError;}
      const state=await loadLikeState(kind,id);
      setLiked(state.liked); setMemberCount(state.count); setPeople(null);
      if(favor)void refreshCommunity();
    } catch(error) {
      console.error("Could not save reaction",error);
      setError("Could not save your reaction. Try again.");
    } finally { setBusy(false); }
  }
  const label=favor?(liked?"Remove Favor":"Grant Favor"):(liked?"Unlike":"Like");

  return <span className={styles.likeWrap}>
    <button type="button" className={`${styles.reactionButton} ${favor?styles.favorButton:""}`} aria-pressed={liked} aria-label={label} data-tooltip={label} disabled={busy} onClick={()=>void toggle()}>
      {favor ? <svg className={styles.favorIcon} viewBox="0 0 20 20" aria-hidden="true"><path d="m3 10 7-7 7 7h-4v7H7v-7H3Z"/></svg> : <span aria-hidden="true">{liked?"♥":"♡"}</span>}
    </button>
    <button className={`${styles.reactionCount} ${count===0?styles.emptyReactionCount:""}`} type="button" disabled={count===0} onClick={()=>void showPeople()} aria-expanded={people!==null} aria-label={`View ${count} ${favor?"Favor":count===1?"like":"likes"}`}>{count||0}</button>
    {people&&<span className={styles.reactionOverlay} role="presentation" onPointerDown={event=>{if(event.target===event.currentTarget)setPeople(null);}}><span className={styles.reactionDialog} role="dialog" aria-modal="true" aria-label={favor?"Favor granted by":"Liked by"}><span className={styles.reactionDialogHeader}><b>{favor?"Favor":"Likes"}</b><button type="button" onClick={()=>setPeople(null)} aria-label="Close">×</button></span><span className={styles.reactionPeople}>{people.length?people.map((person,index)=>{const content=<><span className={styles.reactorAvatar}>{person.avatar_url?<img src={person.avatar_url} alt=""/>:(person.initials??person.display_name.slice(0,2).toUpperCase())}</span><span><b>{person.display_name}</b><small>@{person.username}</small></span></>;return person.href?<Link key={`${person.username}-${index}`} href={person.href} onClick={()=>setPeople(null)}>{content}</Link>:<span className={styles.reactorRow} key={`${person.username}-${index}`}>{content}</span>}):<span className={styles.noReactions}>No reactions yet.</span>}</span></span></span>}
    {error&&<small role="status">{error}</small>}
  </span>;
}
