"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getCommentLink } from "@/lib/communityLinks";
import LikeButton from "./LikeButton";
import styles from "@/app/users/[username]/profile.module.css";
type Tab = "thread" | "post" | "raven";
type Activity = { id: string; title?: string; body: string; created_at: string; thread_id?: string; entry_id?: string; parent_id?: string | null };
export default function ProfileActivity({ userId }: { userId: string }) {
  const [tab, setTab] = useState<Tab>("thread"), [rows, setRows] = useState<Activity[]>([]);
  const [page, setPage] = useState(0), [more, setMore] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const supabase = useMemo(() => createClient(), []);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    const table = tab === "thread" ? "forum_threads" : tab === "post" ? "forum_posts" : "raven_comments";
    void supabase.from(table).select("*").eq("user_author_id", userId).eq("is_visible", true).order("created_at", { ascending: false }).order("id").range(page * 20, page * 20 + 19).then(({ data, error }) => {
      if (!active) return;
      if (error) setError("Activity could not be loaded.");
      else { setRows(previous => page === 0 ? data ?? [] : [...previous, ...(data ?? [])]); setMore(data?.length === 20); }
      setLoading(false);
    });
    return () => { active = false; };
  }, [tab, page, userId, supabase]);
  return <section className={styles.activity}>
    <div className={styles.tabs} role="tablist" aria-label="Profile activity">{([["thread", "Threads"], ["post", "Replies"], ["raven", "Raven's Eye"]] as const).map(([key, label]) => <button role="tab" aria-selected={tab === key} aria-controls="profile-activity" key={key} onClick={() => { if (key === tab) return; setTab(key); setPage(0); setRows([]); }}>{label}</button>)}</div>
    <div id="profile-activity" role="tabpanel" aria-label={tab}>
      {rows.map(row => {
        const href = tab === "thread" ? `/forum?thread=${row.id}` : getCommentLink({ id: row.id, entryId: row.thread_id ?? row.entry_id ?? "", surface: tab === "post" ? "forum" : undefined });
        return <article key={row.id} className={styles.activityCard}><Link href={href}>{row.title && <h3>{row.title}</h3>}<small>{row.parent_id ? "Reply · " : ""}{new Date(row.created_at).toLocaleDateString("en-GB")}</small><p>{row.body}</p></Link><LikeButton kind={tab} id={row.id} /></article>;
      })}
      {loading && <p role="status">Loading activity…</p>}{error && <p role="alert">{error}</p>}{!loading && !error && !rows.length && <p className={styles.empty}>No {tab === "thread" ? "threads" : tab === "post" ? "replies" : "comments"} yet.</p>}
      {more && <button className={styles.actionButton} disabled={loading} onClick={() => setPage(p => p + 1)}>Load more</button>}
    </div>
  </section>;
}
