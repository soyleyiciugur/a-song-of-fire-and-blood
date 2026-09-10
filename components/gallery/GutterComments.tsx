"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MiniPortrait from "@/components/MiniPortrait";
import gallery from "@/data/gallery.json";
import { useCommunity, refreshCommunity } from "@/lib/communityStore";
import { getGutterComments, getGutterIdentity, getGutterThreads, getGutterUserStats, gutterUserMap, type GutterComment } from "@/lib/fleaBottom";
import styles from "./gutterComments.module.css";

function Comment({ comment, replies, pinned = false }: { comment: GutterComment; replies: GutterComment[]; pinned?: boolean }) {
  const user = gutterUserMap.get(comment.authorId);
  if (!user) return null;
  const stats = getGutterUserStats(user.id);
  const identity = getGutterIdentity(user);
  return (
    <li id={`comment-${comment.id}`} tabIndex={-1} className={`${styles.comment} ${pinned ? styles.pinned : ""}`} data-comment-id={comment.id} data-pinned={pinned || undefined}>
      {pinned && <div className={styles.pinLabel}>Pinned · {identity?.type === "character" ? "From the cast" : "Character replied"}</div>}
      <article>
        <details className={styles.profile}>
          <summary>
            {user.account?.type === "character" ? <MiniPortrait id={user.account.characterId} alt={identity?.name ?? user.username} size={30} /> : <span className={styles.avatar} style={{ backgroundColor: user.color }} aria-hidden="true">{user.avatar}</span>}
            <span className={styles.username}>@{user.username}</span>
            {identity && <span className={`${styles.verified} ${identity.type === "institution" ? styles.institution : ""}`} role="img" aria-label={`Verified ${identity.type} account`} title={`Verified ${identity.type} account · fictional`}>
              <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="m10 0 2.3 2 3-.1.6 3 2.5 1.7-1.3 2.7.6 3-2.8 1.1-1.4 2.7-2.9-.8-2.6 1.5-2-2.3-3-.4.1-3L1 8.9l1.9-2.3.2-3 3-.6L8 .5z"/><path d="m6 9.5 2.4 2.4 5-5" fill="none" stroke="#10151d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>}
            <span className={styles.profileHint}>profile</span>
          </summary>
          <div className={styles.bio}>
            {(user.displayName || user.pronouns) && (
              <div className={styles.profileIdentity}>
                {user.displayName && <strong>{user.displayName}</strong>}
                {user.pronouns && <span>{user.pronouns}</span>}
              </div>
            )}
            <span className={styles.badge}>{identity?.type === "character" ? "RP character · fictional account" : identity?.type === "institution" ? "In-world institution · fictional account" : user.kind === "fictional" ? "Fictional regular" : "Community member"}</span>
            <p>{user.bio}</p>
            {identity && <p className={styles.identitySource}>
              {identity.href ? <Link href={identity.href}>{identity.name} ↗</Link> : identity.name}
              {identity.age !== null && <span> · Age {identity.age} in the chronicle</span>}
            </p>}
            {(user.location || user.current) && (
              <dl className={styles.profileFacts}>
                {user.location && <div><dt>Based in</dt><dd>{user.location}</dd></div>}
                {user.current && <div><dt>{user.current.label}</dt><dd>{user.current.value}</dd></div>}
              </dl>
            )}
            <p className={styles.activity}>{stats.comments} {stats.comments === 1 ? "comment" : "comments"} across {stats.posts} {stats.posts === 1 ? "post" : "posts"}</p>
            <p className={styles.activity}>{user.friendCount ?? 0} {(user.friendCount ?? 0) === 1 ? "friend" : "friends"}</p>
          </div>
        </details>
        <p className={styles.body}>{comment.body}</p>
      </article>
      {replies.length > 0 && (
        <ol className={styles.replies} aria-label={`Replies to @${user.username}`}>
          {replies.map((reply) => <Comment key={reply.id} comment={reply} replies={[]} />)}
        </ol>
      )}
    </li>
  );
}

export default function GutterComments({ entryId, collapsible = false }: { entryId: string; collapsible?: boolean }) {
  const community = useCommunity();
  const searchParams = useSearchParams();
  const requestedComment = searchParams.get("comment");
  const comments = getGutterComments(entryId);
  const target = comments.find((comment) => comment.id === requestedComment);
  const [open, setOpen] = useState(!collapsible || !!target);
  const handledTarget = useRef<string | null>(null);
  const entry = gallery.find((item) => item.id === entryId);
  const canon = entry?.category !== "fleabottom" && !/\.(mp4|webm|mov)$/i.test(entry?.src ?? "");
  const panelId = useId();
  const threads = getGutterThreads(entryId);
  useEffect(() => {
    if (!target || handledTarget.current === target.id) return;
    setOpen(true);
    const timer = setTimeout(() => {
      const element = document.getElementById(`comment-${target.id}`);
      if (!element) return;
      element.scrollIntoView({ block: "center", behavior: "instant" });
      element.focus({ preventScroll: true });
      element.dataset.highlighted = "true";
      handledTarget.current = target.id;
    }, 150);
    return () => clearTimeout(timer);
  }, [target]);
  return (
    <section className={`${styles.section} ${collapsible ? styles.collapsible : ""}`} data-ready={community.loaded} aria-label="Gallery comments" onKeyDown={(event) => {
      if (event.key !== "Escape") event.stopPropagation();
    }}>
      {collapsible ? (
        <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
          <span>Gutter talk · {comments.length}</span><span>{open ? "Close" : "Read comments"}</span>
        </button>
      ) : <h2 className={styles.heading}>{canon ? "Discussion" : "Gutter talk"} <span>{comments.length}</span></h2>}
      <div id={panelId} hidden={!open} className={collapsible ? styles.reelPanel : undefined}>
        <p className={styles.intro}>{canon ? "Canon scene. Reader reactions and fictional character cameos below are not new canon." : "Fictional regulars, occasional cast cameos. Character conversations are pinned."}</p>
        {!community.loaded && !community.error && <p role="status">Loading comments…</p>}
        {community.error && <p role="status">{community.error} <button type="button" onClick={() => void refreshCommunity()}>Retry</button></p>}
        {requestedComment && searchParams.get("item") === entryId && community.loaded && !target && <p role="status">This comment is not available yet.</p>}
        {threads.length ? (
          <ol className={styles.thread}>
            {threads.map(({ comment, replies, pinned }) => <Comment key={comment.id} comment={comment} replies={replies} pinned={pinned} />)}
          </ol>
        ) : <p className={styles.intro}>The gutters are quiet. For now.</p>}
        <p className={styles.footer}>Member accounts & comments are coming later. For now, meet the regulars.</p>
      </div>
    </section>
  );
}
