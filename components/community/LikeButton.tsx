"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadLikeState } from "@/lib/memberLikes";
import styles from "./composer.module.css";
export default function LikeButton({ kind, id }: { kind: "thread" | "post" | "raven" | "message"; id: string }) {
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
      if (!user) { setError("Sign in to like."); return; }
      const query = liked ? supabase.from("member_likes").delete().eq("user_id", user.id).eq("target_kind", kind).eq("target_id", id) : supabase.from("member_likes").upsert({ user_id: user.id, target_kind: kind, target_id: id }, { onConflict: "user_id,target_kind,target_id", ignoreDuplicates: true });
      const { error } = await query;
      if (error) throw error;
      const state = await loadLikeState(kind, id); setLiked(state.liked); setCount(state.count);
    } catch { setError("Could not save your like. Try again."); }
    finally { setBusy(false); }
  }
  return <span className={styles.likeWrap}><button type="button" className={styles.like} aria-pressed={liked} aria-label={`${liked ? "Unlike" : "Like"}, ${count} likes`} disabled={busy} onClick={() => void toggle()}>{liked ? "♥" : "♡"} {count || "Like"}</button>{error && <small role="status">{error}</small>}</span>;
}
