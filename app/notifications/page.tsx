"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { redirect, useSearchParams } from "next/navigation";
import { useCommunity, refreshCommunity } from "@/lib/communityStore";
import { getCommentEntryLabel, getCommentLink } from "@/lib/communityLinks";
import { groupNotifications } from "@/lib/notificationTime.mjs";
import { createClient } from "@/lib/supabase/client";
import MiniPortrait from "@/components/MiniPortrait";
import styles from "./notifications.module.css";

const dateLabel = (value: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(value));
const STORAGE_KEY = "asofab:notifications:last-seen";

type Filter = "for-you" | "all";

function Notifications() {
  const data = useCommunity();
  const params = useSearchParams();
  const [limit, setLimit] = useState(30);
  const [filter, setFilter] = useState<Filter>("for-you");
  const [userId, setUserId] = useState<string | null>(null);
  const [readCutoff, setReadCutoff] = useState<string | null | undefined>(undefined);
  const supabase = useMemo(() => createClient(), []);
  const users = new Map(data.users.map((user) => [user.id, user]));
  const commentsById = new Map(data.comments.map(comment => [comment.id, comment]));
  const threadsById = new Map(data.forumThreads.map(thread => [thread.id, thread]));

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id ?? null));
    return () => auth.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (readCutoff !== undefined) return;
    const previous = window.localStorage.getItem(STORAGE_KEY);
    setReadCutoff(previous);
    const seen = data.serverTime || new Date().toISOString();
    window.localStorage.setItem(STORAGE_KEY, seen);
    window.dispatchEvent(new CustomEvent("asofab:notifications-seen", { detail: seen }));
  }, [data.serverTime, readCutoff]);

  const allComments = data.comments
    .map((comment, order) => ({ comment, order }))
    .sort((a, b) => Date.parse(b.comment.publishedAt) - Date.parse(a.comment.publishedAt) || b.order - a.order)
    .map(({ comment }) => comment)
    .filter(comment => comment.authorId !== userId);

  const forYou = userId ? allComments.filter(comment => {
    const parent = comment.parentId ? commentsById.get(comment.parentId) : null;
    if (parent?.authorId === userId) return true;
    if (comment.surface === "forum" && threadsById.get(comment.entryId)?.authorId === userId) return true;
    return false;
  }) : [];

  const comments = filter === "for-you" && userId ? forYou : allComments;
  const now = data.serverTime ? Date.parse(data.serverTime) : Date.now();
  const timeGroups = groupNotifications(comments.slice(0, limit), now);
  if (params.get("tab") === "updates") redirect("/update-notes");

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m10 6-6 6 6 6M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Back to Home
      </Link>
      <h1 className="realm-page-title">Notifications</h1>
      <p className={styles.intro}>Replies that concern you, plus the wider conversation across the realm.</p>
      <nav className={styles.tabs} aria-label="Notification sections">
        <button type="button" aria-pressed={filter === "for-you"} onClick={() => { setFilter("for-you"); setLimit(30); }}>For you</button>
        <button type="button" aria-pressed={filter === "all"} onClick={() => { setFilter("all"); setLimit(30); }}>All activity</button>

      </nav>
      {!data.loaded && !data.error && <p role="status">Loading notifications…</p>}
      {data.error && <p role="status">{data.error} <button onClick={() => void refreshCommunity()}>Retry</button></p>}
      <section aria-label={filter === "for-you" ? "Notifications for you" : "All community activity"}>
        {filter === "for-you" && !userId && data.loaded && <p className={styles.emptyHint}>Sign in to see replies and discussion activity addressed to you. Showing all activity instead.</p>}
        {timeGroups.map(({label,entries}) => {
          const entryGroups=new Map<string,typeof comments>();
          for(const comment of entries){const key=`${comment.surface==="forum"?"thread":"media"}:${comment.entryId}`;entryGroups.set(key,[...(entryGroups.get(key)??[]),comment]);}
          return <section key={label} className={styles.timeGroup} aria-label={label}><h2 className={styles.timeHeading}>{label}</h2>{[...entryGroups].map(([entryKey,entryComments])=>{const first=entryComments[0],isThread=first.surface==="forum",unread=readCutoff===undefined?[]:entryComments.filter(comment=>!readCutoff||Date.parse(comment.publishedAt)>Date.parse(readCutoff)),read=readCutoff===undefined?entryComments:entryComments.filter(comment=>readCutoff&&Date.parse(comment.publishedAt)<=Date.parse(readCutoff));
          const renderEntries=(items:typeof comments)=><ol className={styles.feed}>{items.map((comment: typeof comments[number]) => {
              const user = users.get(comment.authorId);
              if (!user) return null;
              return <li key={comment.id}><Link href={getCommentLink(comment)} className={styles.card}>
                {user.account?.type === "character" ? <MiniPortrait id={user.account.characterId} alt={user.displayName ?? user.username} size={34} /> : user.avatarUrl ? <span className={styles.avatar}><img src={user.avatarUrl} alt="" /></span> : <span className={styles.avatar} style={{ backgroundColor: user.color }} aria-hidden="true">{user.avatar}</span>}
                <div className={styles.content}>
                  <div className={styles.byline}><strong>@{user.username}</strong> {comment.parentId ? "replied" : "wrote"}</div>
                  <p className={styles.quote}>“{comment.body}”</p>
                  <div className={styles.meta}>{getCommentEntryLabel(comment.entryId)} <span>·</span> <time dateTime={comment.publishedAt}>{dateLabel(comment.publishedAt)} TRT</time></div>
                </div>
                <svg className={styles.openArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link></li>;
            })}</ol>;
          return <details key={entryKey} className={styles.entryGroup}><summary><span className={styles.entryIcon} aria-hidden="true">{isThread?"T":"R"}</span><span className={styles.entrySummary}><small>{isThread?"Taverns thread":"Raven's Eye media"}</small><strong>{getCommentEntryLabel(first.entryId)}</strong></span>{unread.length>0&&<span className={styles.unreadCount}>{unread.length} new</span>}<span className={styles.entryCount}>{entryComments.length}</span></summary><div className={styles.entryBody}>{unread.length>0&&<section className={styles.readSection}><h3>Unread notifications</h3>{renderEntries(unread)}</section>}{read.length>0&&<section className={styles.readSection}><h3>Read notifications</h3>{renderEntries(read)}</section>}</div></details>;
          })}</section>;
        })}
        {data.loaded && !comments.length && <p className={styles.emptyHint}>{filter === "for-you" ? "Nothing addressed to you yet." : "No comments yet."}</p>}
        {comments.length > limit && <button className={styles.more} onClick={() => setLimit(limit + 30)}>Load more comments</button>}
      </section>
    </main>
  );
}

export default function NotificationsPage() {
  return <Suspense fallback={<main className={styles.page}>Loading notifications…</main>}><Notifications /></Suspense>;
}
