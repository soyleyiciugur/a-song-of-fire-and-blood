"use client";
import Link from "next/link";
import { refreshCommunity } from "@/lib/communityStore";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadLikeState } from "@/lib/memberLikes";
import styles from "./composer.module.css";
export default function LikeButton({ kind, id }: { kind: "thread" | "post" | "raven" | "message"; id: string }) {
  const favor = kind === "thread" || kind === "post";
  const [people,setPeople] = useState<{username:string;display_name:string}[] | null>(null);
  async function showPeople() {
    if (people) { setPeople(null); return; }
    const { data, error } = await supabase.from("member_likes").select("user_id").eq("target_kind",kind).eq("target_id",id);
    if(error) {setError("Could not load reactions.");return;}
    const ids=(data??[]).map(row=>row.user_id);
    const result=ids.length?await supabase.from("profiles").select("username,display_name").in("id",ids):{data:[],error:null};
    if(result.error)setError("Could not load reactions.");else setPeople(result.data??[]);
  }
  const supabase = useMemo(() => createClient(), []);
  const [count, setCount] = useState(0), [liked, setLiked] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const refresh = () => { if (document.visibilityState === "visible") void loadLikeState(kind, id).then(state => { if (active) { setCount(state.count); setLiked(state.liked); } }).catch(() => {}); };
    refresh(); const timer = setInterval(refresh, 15000);
    return () => { active = false; clearInterval(timer); };
  }, [id, kind, supabase]);
  async function toggle() {
    setBusy(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError(favor ? "Sign in to grant Favor." : "Sign in to like."); return; }
      const query = liked ? supabase.from("member_likes").delete().eq("user_id", user.id).eq("target_kind", kind).eq("target_id", id) : supabase.from("member_likes").upsert({ user_id: user.id, target_kind: kind, target_id: id }, { onConflict: "user_id,target_kind,target_id", ignoreDuplicates: true });
      const { error } = await query;
      if (error) throw error;
      const state = await loadLikeState(kind, id); setLiked(state.liked); setCount(state.count); setPeople(null); if(favor)void refreshCommunity();
    } catch { setError("Could not save your reaction. Try again."); }
    finally { setBusy(false); }
  }
  return <span className={styles.likeWrap}><button type="button" className={styles.like} aria-pressed={liked} aria-label={`${favor ? liked ? "Remove Favor" : "Grant Favor" : liked ? "Unlike" : "Like"}, ${count} ${favor ? "Favor" : "likes"}`} disabled={busy} onClick={() => void toggle()}>{liked ? "♥" : "♡"} {favor ? `${count} ${liked ? "Favor" : "Grant Favor"}` : count || "Like"}</button>{count>0&&<button className={styles.like} type="button" onClick={()=>void showPeople()} aria-expanded={people!==null}>{favor?"Who granted Favor":"Who liked"}</button>}{people && <span>{people.length?people.map(p=><Link key={p.username} href={`/users/${p.username}`}>{p.display_name} </Link>):"No reactions yet."}</span>}{error && <small role="status">{error}</small>}</span>;
}
