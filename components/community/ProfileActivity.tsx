"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getCommentLink } from "@/lib/communityLinks";
import forumData from "@/data/forum.json";
import fleaData from "@/data/flea-bottom.json";
import gallery from "@/data/gallery.json";
import LikeButton from "./LikeButton";
import styles from "@/app/users/[username]/profile.module.css";

type Tab = "thread" | "post" | "raven" | "reactions";
type Activity = { id: string; title?: string; body: string; created_at: string; thread_id?: string; entry_id?: string; parent_id?: string | null };
type Reaction = { target_kind: string; target_id: string; direction: string; latest: string; href: string; target_title?: string | null; preview?: string; groupKey?: string };

const threadTitles = new Map((forumData.threads ?? []).map((item) => [item.id, item.title] as const));
const postThreads = new Map((forumData.comments ?? []).map((item) => [item.id, item.entryId] as const));
const bodies = new Map([...(forumData.comments ?? []), ...(fleaData.comments ?? [])].map((item) => [item.id, item.body] as const));
const captions = new Map(gallery.map((item) => [item.id, item.caption?.trim().split("\n")[0] || "Untitled Raven's Eye item"] as const));

export default function ProfileActivity({ userId }: { userId: string }) {
  const [tab, setTab] = useState<Tab>("thread");
  const [rows, setRows] = useState<Activity[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;
    if (tab === "reactions") {
      void (async () => {
        const { data, error: reactionError } = await supabase.rpc("profile_reactions", { member_id: userId });
        if (!active) return;
        if (reactionError) {
          setError("Activity could not be loaded.");
          setLoading(false);
          return;
        }
        const list = ((data ?? []) as Reaction[]).filter((item) => item.direction === "given");
        const ids = list.filter((item) => item.target_kind === "raven" && !bodies.has(item.target_id)).map((item) => item.target_id);
        const live = new Map<string, { entry_id: string; body: string }>();
        if (ids.length) {
          const { data: comments } = await supabase.from("raven_comments").select("id,entry_id,body").in("id", ids);
          for (const comment of comments ?? []) live.set(comment.id, comment);
        }
        const resolved: Record<string, string> = {};
        const needThreads = new Set<string>();
        const needPosts: string[] = [];
        for (const row of list) {
          if (row.target_kind === "raven") {
            const found = live.get(row.target_id);
            const stored = (fleaData.comments ?? []).find((item) => item.id === row.target_id);
            const entry = found?.entry_id ?? stored?.entryId ?? new URL(row.href, "https://local").searchParams.get("item") ?? row.target_id;
            row.target_title = captions.get(entry) ?? "Untitled Raven's Eye item";
            row.preview = found?.body ?? bodies.get(row.target_id);
            row.groupKey = `raven:${entry}`;
          } else {
            const thread = row.target_kind === "thread" ? row.target_id : postThreads.get(row.target_id) ?? new URL(row.href, "https://local").searchParams.get("thread") ?? row.target_id;
            row.groupKey = `thread:${thread}`;
            row.preview = bodies.get(row.target_id);
            if (row.target_title) resolved[`${row.target_kind}:${row.target_id}`] = row.target_title;
            else if (row.target_kind === "thread") {
              const title = threadTitles.get(row.target_id);
              if (title) resolved[`thread:${row.target_id}`] = title;
              else needThreads.add(row.target_id);
            } else needPosts.push(row.target_id);
          }
        }
        if (needPosts.length) {
          const { data: posts } = await supabase.from("forum_posts").select("id,thread_id,body").in("id", needPosts);
          for (const post of posts ?? []) {
            needThreads.add(post.thread_id);
            const row = list.find((item) => item.target_id === post.id);
            if (row) row.preview = post.body;
          }
          const postMap = new Map((posts ?? []).map((post) => [post.id, post.thread_id]));
          const { data: threads } = needThreads.size ? await supabase.from("forum_threads").select("id,title").in("id", [...needThreads]) : { data: [] };
          const byId = new Map((threads ?? []).map((thread) => [thread.id, thread.title]));
          for (const [id, thread] of postMap) {
            const title = byId.get(thread);
            if (title) resolved[`post:${id}`] = title;
          }
        } else if (needThreads.size) {
          const { data: threads } = await supabase.from("forum_threads").select("id,title").in("id", [...needThreads]);
          for (const thread of threads ?? []) resolved[`thread:${thread.id}`] = thread.title;
        }
        if (active) {
          setReactions(list);
          setTitles(resolved);
          setMore(false);
          setLoading(false);
        }
      })();
      return () => { active = false; };
    }

    const table = tab === "thread" ? "forum_threads" : tab === "post" ? "forum_posts" : "raven_comments";
    void supabase.from(table).select("*").eq("user_author_id", userId).eq("is_visible", true).order("created_at", { ascending: false }).order("id").range(page * 20, page * 20 + 19).then(({ data, error: queryError }) => {
      if (!active) return;
      if (queryError) setError("Activity could not be loaded.");
      else {
        setRows((old) => page === 0 ? data ?? [] : [...old, ...(data ?? [])]);
        setMore(data?.length === 20);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [tab, page, userId, supabase]);

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    setLoading(true);
    setError("");
    setPage(0);
    setRows([]);
    setReactions([]);
    setTitles({});
  };

  const grouped = new Map<string, Reaction[]>();
  for (const row of reactions) {
    const key = row.groupKey ?? `${row.target_kind}:${row.target_id}`;
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }

  const postGroups = new Map<string, Activity[]>();
  for (const row of rows) {
    const key = row.thread_id ?? row.id;
    postGroups.set(key, [...(postGroups.get(key) ?? []), row]);
  }

  const postTitle = (threadId: string) => threadTitles.get(threadId) ?? "Tavern discussion";
  const ravenTitle = (entryId?: string) => captions.get(entryId ?? "") ?? "Untitled Raven's Eye item";

  const renderReactionGroups = () => [...grouped].map(([key, group]) => {
    const first = group[0];
    const title = first.target_title || titles[`${first.target_kind}:${first.target_id}`] || "Taverns";
    return <details key={key} className={styles.reactionGroup}><summary><span><span className={styles.activityKicker}>{first.target_kind === "raven" ? "Raven's Eye" : "Taverns"}</span><strong>{title}</strong></span><span>{group.length} {group.length === 1 ? "activity" : "activities"}</span></summary><div>{group.map((row) => <article key={`${row.target_kind}-${row.target_id}`} className={styles.activityCard}><Link href={row.href}><span className={styles.activityKicker}>{row.target_kind === "raven" ? "Liked comment" : "Granted Favor"}</span><small>{new Date(row.latest).toLocaleDateString("en-GB")}</small>{row.preview && <p>{row.preview}</p>}<span className={styles.permalink}>Open permalink ↗</span></Link></article>)}</div></details>;
  });

  const renderPostGroups = () => [...postGroups].map(([key, group]) => <details key={key} className={styles.reactionGroup}><summary><span><span className={styles.activityKicker}>Tavern Talks</span><strong>{postTitle(key)}</strong></span><span>{group.length} {group.length === 1 ? "reply" : "replies"}</span></summary><div>{group.map((row) => <article key={row.id} className={styles.activityCard}><Link href={getCommentLink({ id: row.id, entryId: row.thread_id ?? "", surface: "forum" })}><small>{row.parent_id ? "Reply · " : ""}{new Date(row.created_at).toLocaleDateString("en-GB")}</small><p>{row.body}</p></Link><LikeButton kind="post" id={row.id} /></article>)}</div></details>);

  const renderRows = () => rows.map((row) => {
    const href = tab === "thread" ? `/forum?thread=${row.id}` : getCommentLink({ id: row.id, entryId: row.thread_id ?? row.entry_id ?? "", surface: undefined });
    return <article key={row.id} className={styles.activityCard}><Link href={href}>{tab === "raven" && <span className={styles.activityKicker}>Raven&apos;s Eye</span>}{tab === "raven" ? <h3>{ravenTitle(row.entry_id)}</h3> : row.title && <h3>{row.title}</h3>}<small>{row.parent_id ? "Reply · " : ""}{new Date(row.created_at).toLocaleDateString("en-GB")}</small><p>{row.body}</p></Link>{tab === "raven" && <LikeButton kind="raven" id={row.id} />}</article>;
  });

  const activityContent = tab === "reactions" ? renderReactionGroups() : tab === "post" ? renderPostGroups() : renderRows();

  return <section className={styles.activity}><h2>Activity</h2><div className={styles.tabs} role="tablist" aria-label="Profile activity">{([['thread', 'Tavern Topics'], ['post', 'Tavern Talks'], ['raven', "The Raven's Eye"], ['reactions', 'Likes & Favor']] as const).map(([key, label]) => <button role="tab" aria-selected={tab === key} aria-controls="profile-activity" key={key} onClick={() => switchTab(key)}>{label}</button>)}</div><div id="profile-activity" role="tabpanel" aria-label={tab}>{activityContent}{loading && <p role="status">Loading activity…</p>}{error && <p role="alert">{error}</p>}{!loading && !error && tab === "reactions" && !reactions.length && <p className={styles.empty}>No recent likes or Favor granted.</p>}{!loading && !error && tab !== "reactions" && !rows.length && <p className={styles.empty}>No {tab === "thread" ? "threads" : tab === "post" ? "replies" : "comments"} yet.</p>}{more && tab !== "reactions" && <button className={styles.actionButton} disabled={loading} onClick={() => setPage((value) => value + 1)}>Load more</button>}</div></section>;
}
