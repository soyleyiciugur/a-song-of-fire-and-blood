"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCommunity, refreshCommunity } from "@/lib/communityStore";
import { getCommentEntryLabel, getCommentLink } from "@/lib/communityLinks";
import { groupNotifications } from "@/lib/notificationTime.mjs";
import MiniPortrait from "@/components/MiniPortrait";
import UpdatesFeed from '@/components/UpdatesFeed';
import styles from "./notifications.module.css";

const dateLabel = (value: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(value));

function Notifications() {
  const data = useCommunity();
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get("tab") === "updates" ? "updates" : "comments";
  const [limit, setLimit] = useState(30);
  const users = new Map(data.users.map((user) => [user.id, user]));
  const comments = data.comments.map((comment, order) => ({ comment, order })).sort((a, b) => Date.parse(b.comment.publishedAt) - Date.parse(a.comment.publishedAt) || b.order - a.order).map(({ comment }) => comment);
  const now = data.serverTime ? Date.parse(data.serverTime) : Date.now();
  const groups = groupNotifications(comments.slice(0, limit), now);
  return (
    <main className={styles.page}>
      <Link href="/ravens-eye" className={styles.back}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m10 6-6 6 6 6M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        The Raven&apos;s Eye
      </Link>
      <h1>Notifications</h1>
      <p className={styles.intro}>New conversations and notes from the archive.</p>
      <div className={styles.tabs} role="tablist" aria-label="Notification sections" onKeyDown={(event) => {
        if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          const next = event.key === "Home" ? "comments" : event.key === "End" ? "updates" : tab === "comments" ? "updates" : "comments";
          router.replace(`/notifications${next === "updates" ? "?tab=updates" : ""}`, { scroll: false });
          document.getElementById(`tab-${next}`)?.focus();
        }
      }}>
        {(["comments", "updates"] as const).map((value) => <button key={value} id={`tab-${value}`} type="button" role="tab" aria-selected={tab === value} aria-controls={`panel-${value}`} tabIndex={tab === value ? 0 : -1} onClick={() => router.replace(`/notifications${value === "updates" ? "?tab=updates" : ""}`, { scroll: false })}>{value === "comments" ? "Latest comments" : "Update notes"}</button>)}
      </div>
      {!data.loaded && !data.error && <p role="status">Loading notifications…</p>}
      {data.error && <p role="status">{data.error} <button onClick={() => void refreshCommunity()}>Retry</button></p>}
      <section id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "comments" ? <>
          {groups.map(({label, entries}) => <section key={label} className={styles.timeGroup} aria-label={label}>
          <h2 className={styles.timeHeading}>{label}</h2>
          <ol className={styles.feed}>
            {entries.map((comment: typeof comments[number]) => {
              const user = users.get(comment.authorId);
              if (!user) return null;
              return <li key={comment.id}><Link href={getCommentLink(comment)} className={styles.card}>
                {user.account?.type === "character" ? <MiniPortrait id={user.account.characterId} alt={user.displayName ?? user.username} size={34} /> : <span className={styles.avatar} style={{ backgroundColor: user.color }} aria-hidden="true">{user.avatar}</span>}
                <div className={styles.content}>
                  <div className={styles.byline}><strong>@{user.username}</strong> {comment.parentId ? "replied" : "wrote"}</div>
                  <p className={styles.quote}>“{comment.body}”</p>
                  <div className={styles.meta}>{getCommentEntryLabel(comment.entryId)} <span>·</span> <time dateTime={comment.publishedAt}>{dateLabel(comment.publishedAt)} TRT</time></div>
                </div>
                <span aria-hidden="true">↗</span>
              </Link></li>;
            })}
          </ol>
          </section>)}
          {data.loaded && !comments.length && <p>No comments yet.</p>}
          {comments.length > limit && <button className={styles.more} onClick={() => setLimit(limit + 30)}>Load more comments</button>}
        </> : data.loaded && <UpdatesFeed updates={data.updates} now={now}/>}
      </section>
    </main>
  );
}

export default function NotificationsPage() {
  return <Suspense fallback={<main className={styles.page}>Loading notifications…</main>}><Notifications /></Suspense>;
}
