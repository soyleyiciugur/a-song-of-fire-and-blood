"use client";

import Link from "next/link";
import { refreshCommunity } from "@/lib/communityStore";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadLikeState } from "@/lib/memberLikes";
import styles from "./composer.module.css";

type Reactor = {
  username: string;
  display_name: string;
  avatar_url?: string | null;
};

export default function LikeButton({ kind, id }: { kind: "thread" | "post" | "raven" | "message"; id: string }) {
  const favor = kind === "thread" || kind === "post";
  const supabase = useMemo(() => createClient(), []);
  const [people, setPeople] = useState<Reactor[] | null>(null);
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      void loadLikeState(kind, id)
        .then((state) => {
          if (active) {
            setCount(state.count);
            setLiked(state.liked);
          }
        })
        .catch(() => {});
    };
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id, kind]);

  useEffect(() => {
    if (!people) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPeople(null);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [people]);

  async function showPeople() {
    if (people) {
      setPeople(null);
      return;
    }
    setError("");
    const { data, error: likesError } = await supabase
      .from("member_likes")
      .select("user_id")
      .eq("target_kind", kind)
      .eq("target_id", id);
    if (likesError) {
      setError("Could not load reactions.");
      return;
    }
    const ids = (data ?? []).map((row) => row.user_id);
    const result = ids.length
      ? await supabase.from("profiles").select("username,display_name,avatar_url").in("id", ids)
      : { data: [] as Reactor[], error: null };
    if (result.error) setError("Could not load reactions.");
    else setPeople((result.data ?? []) as Reactor[]);
  }

  async function toggle() {
    setBusy(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError(favor ? "Sign in to grant Favor." : "Sign in to like.");
        return;
      }
      const query = liked
        ? supabase.from("member_likes").delete().eq("user_id", user.id).eq("target_kind", kind).eq("target_id", id)
        : supabase.from("member_likes").upsert(
            { user_id: user.id, target_kind: kind, target_id: id },
            { onConflict: "user_id,target_kind,target_id", ignoreDuplicates: true }
          );
      const { error: saveError } = await query;
      if (saveError) throw saveError;
      const state = await loadLikeState(kind, id);
      setLiked(state.liked);
      setCount(state.count);
      setPeople(null);
      if (favor) void refreshCommunity();
    } catch {
      setError("Could not save your reaction. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const label = favor ? (liked ? "Remove Favor" : "Grant Favor") : (liked ? "Unlike" : "Like");

  return (
    <span className={styles.likeWrap}>
      <button
        type="button"
        className={`${styles.reactionButton} ${favor ? styles.favorButton : ""}`}
        aria-pressed={liked}
        aria-label={label}
        title={label}
        disabled={busy}
        onClick={() => void toggle()}
      >
        <span aria-hidden="true">{favor ? "▲" : liked ? "♥" : "♡"}</span>
      </button>
      {count > 0 && (
        <button
          className={styles.reactionCount}
          type="button"
          onClick={() => void showPeople()}
          aria-expanded={people !== null}
          aria-label={`View ${count} ${favor ? "Favor" : count === 1 ? "like" : "likes"}`}
        >
          {count}
        </button>
      )}
      {people && (
        <span className={styles.reactionOverlay} role="presentation" onPointerDown={(event) => {
          if (event.target === event.currentTarget) setPeople(null);
        }}>
          <span className={styles.reactionDialog} role="dialog" aria-modal="true" aria-label={favor ? "Favor granted by" : "Liked by"}>
            <span className={styles.reactionDialogHeader}>
              <b>{favor ? "Favor" : "Likes"}</b>
              <button type="button" onClick={() => setPeople(null)} aria-label="Close">×</button>
            </span>
            <span className={styles.reactionPeople}>
              {people.length ? people.map((person) => (
                <Link key={person.username} href={`/users/${person.username}`} onClick={() => setPeople(null)}>
                  <span className={styles.reactorAvatar}>
                    {person.avatar_url ? <img src={person.avatar_url} alt="" /> : person.display_name.slice(0, 2).toUpperCase()}
                  </span>
                  <span><b>{person.display_name}</b><small>@{person.username}</small></span>
                </Link>
              )) : <span className={styles.noReactions}>No reactions yet.</span>}
            </span>
          </span>
        </span>
      )}
      {error && <small role="status">{error}</small>}
    </span>
  );
}
