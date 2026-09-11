"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getCommentLink } from "@/lib/communityLinks";
import forumData from "@/data/forum.json";
import LikeButton from "./LikeButton";
import styles from "@/app/users/[username]/profile.module.css";

type Tab = "thread" | "post" | "raven" | "reactions";
type Activity = { id:string; title?:string; body:string; created_at:string; thread_id?:string; entry_id?:string; parent_id?:string|null };
type Reaction = { target_kind:string; target_id:string; direction:string; total:number; latest:string; href:string; target_title?:string|null };

const staticThreadTitles = new Map((forumData.threads ?? []).map(thread => [thread.id, thread.title] as const));
const staticPostThreads = new Map((forumData.comments ?? []).map(comment => [comment.id, comment.entryId] as const));

export default function ProfileActivity({userId}:{userId:string}){
 const [tab,setTab]=useState<Tab>("thread"),[rows,setRows]=useState<Activity[]>([]),[reactionRows,setReactionRows]=useState<Reaction[]>([]),[reactionTitles,setReactionTitles]=useState<Record<string,string>>({}),[page,setPage]=useState(0),[more,setMore]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const supabase=useMemo(()=>createClient(),[]);
 useEffect(()=>{let active=true;setLoading(true);setError("");
  if(tab==="reactions"){
   void (async()=>{
    const {data,error}=await supabase.rpc("profile_reactions",{member_id:userId});
    if(!active)return;
    if(error){setError("Activity could not be loaded.");setLoading(false);return;}
    const reactions=((data??[]) as Reaction[]).filter(row=>row.direction==="given");
    setReactionRows(reactions);
    const titles:Record<string,string>={};
    const liveThreadIds=new Set<string>(); const livePostIds:string[]=[];
    for(const row of reactions){
      if(row.target_title){titles[`${row.target_kind}:${row.target_id}`]=row.target_title;continue;}
      if(row.target_kind==="thread"){
        const title=staticThreadTitles.get(row.target_id); if(title)titles[`thread:${row.target_id}`]=title; else liveThreadIds.add(row.target_id);
      } else if(row.target_kind==="post"){
        const threadId=staticPostThreads.get(row.target_id); const title=threadId?staticThreadTitles.get(threadId):undefined;
        if(title)titles[`post:${row.target_id}`]=title; else livePostIds.push(row.target_id);
      }
    }
    if(livePostIds.length){
      const {data:posts}=await supabase.from("forum_posts").select("id,thread_id").in("id",livePostIds);
      for(const post of posts??[])liveThreadIds.add(post.thread_id);
      const postThread=new Map((posts??[]).map(post=>[post.id,post.thread_id]));
      if(liveThreadIds.size){
        const {data:threads}=await supabase.from("forum_threads").select("id,title").in("id",[...liveThreadIds]);
        const byId=new Map((threads??[]).map(thread=>[thread.id,thread.title]));
        for(const id of liveThreadIds){const title=byId.get(id);if(title)titles[`thread:${id}`]=title;}
        for(const [postId,threadId] of postThread){const title=byId.get(threadId);if(title)titles[`post:${postId}`]=title;}
      }
    } else if(liveThreadIds.size){
      const {data:threads}=await supabase.from("forum_threads").select("id,title").in("id",[...liveThreadIds]);
      for(const thread of threads??[])titles[`thread:${thread.id}`]=thread.title;
    }
    if(active){setReactionTitles(titles);setMore(false);setLoading(false);}
   })();
   return()=>{active=false};
  }
  const table=tab==="thread"?"forum_threads":tab==="post"?"forum_posts":"raven_comments";
  void supabase.from(table).select("*").eq("user_author_id",userId).eq("is_visible",true).order("created_at",{ascending:false}).order("id").range(page*20,page*20+19).then(({data,error})=>{if(!active)return;if(error)setError("Activity could not be loaded.");else{setRows(previous=>page===0?data??[]:[...previous,...(data??[])]);setMore(data?.length===20);}setLoading(false);});
  return()=>{active=false};
 },[tab,page,userId,supabase]);
 const switchTab=(next:Tab)=>{if(next===tab)return;setTab(next);setPage(0);setRows([]);setReactionRows([]);setReactionTitles({});};
 return <section className={styles.activity}><h2>Activity</h2><div className={styles.tabs} role="tablist" aria-label="Profile activity">{([["thread","Threads"],["post","Replies"],["raven","Raven's Eye"],["reactions","Likes & Favor"]] as const).map(([key,label])=><button role="tab" aria-selected={tab===key} aria-controls="profile-activity" key={key} onClick={()=>switchTab(key)}>{label}</button>)}</div><div id="profile-activity" role="tabpanel" aria-label={tab}>
 {tab==="reactions"?reactionRows.map(row=>{const title=row.target_kind==="raven"?"Raven's Eye comment":row.target_title||reactionTitles[`${row.target_kind}:${row.target_id}`]||"Taverns";return <article key={`${row.target_kind}-${row.target_id}`} className={styles.activityCard}><Link href={row.href}><span className={styles.activityKicker}>{row.target_kind==="raven"?"Liked":"Granted Favor"}</span><h3>{title}</h3><small>{new Date(row.latest).toLocaleDateString("en-GB")}</small></Link></article>}):rows.map(row=>{const href=tab==="thread"?`/forum?thread=${row.id}`:getCommentLink({id:row.id,entryId:row.thread_id??row.entry_id??"",surface:tab==="post"?"forum":undefined});return <article key={row.id} className={styles.activityCard}><Link href={href}>{row.title&&<h3>{row.title}</h3>}<small>{row.parent_id?"Reply · ":""}{new Date(row.created_at).toLocaleDateString("en-GB")}</small><p>{row.body}</p></Link><LikeButton kind={tab} id={row.id}/></article>})}
 {loading&&<p role="status">Loading activity…</p>}{error&&<p role="alert">{error}</p>}{!loading&&!error&&tab==="reactions"&&!reactionRows.length&&<p className={styles.empty}>No recent likes or Favor granted.</p>}{!loading&&!error&&tab!=="reactions"&&!rows.length&&<p className={styles.empty}>No {tab==="thread"?"threads":tab==="post"?"replies":"comments"} yet.</p>}{more&&tab!=="reactions"&&<button className={styles.actionButton} disabled={loading} onClick={()=>setPage(p=>p+1)}>Load more</button>}</div></section>;
}
