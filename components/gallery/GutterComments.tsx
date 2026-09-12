"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MiniPortrait from "@/components/MiniPortrait";
import FriendAccounts from './FriendAccounts';
import gallery from "@/data/gallery.json";
import { useCommunity, refreshCommunity } from "@/lib/communityStore";
import { getGutterComments, getGutterIdentity, getGutterUserStats, gutterUserMap, isCharacterComment, type GutterComment } from "@/lib/fleaBottom";
import { buildCommentTree, countDescendants, someCommentInBranch, type CommentTreeNode } from "@/lib/commentThreads";
import styles from "./gutterComments.module.css";
import Composer from "@/components/community/Composer";
import ContentActions from "@/components/community/ContentActions";
import LikeButton from "@/components/community/LikeButton";
import { getCommentLink } from "@/lib/communityLinks";

function Comment({ node, pinned = false }: { node: CommentTreeNode; pinned?: boolean }) {
  const { comment, children } = node;
  const user = gutterUserMap.get(comment.authorId);
  const [expanded, setExpanded] = useState(true);
  if (!user) {
    return <>{children.map((child) => <Comment key={child.comment.id} node={child} />)}</>;
  }
  const stats = getGutterUserStats(user.id);
  const identity = getGutterIdentity(user);
  const descendantCount = countDescendants(node);
  return (
    <li id={`comment-${comment.id}`} tabIndex={-1} className={`${styles.comment} ${pinned ? styles.pinned : ""}`} data-comment-id={comment.id} data-pinned={pinned || undefined}>
      <article className={styles.commentContent}>
          {pinned && <div className={styles.pinLabel}>Pinned · {identity?.type === "character" ? "From the cast" : "Character replied"}</div>}
          {comment.parentId && <Link href={getCommentLink({ ...comment, id: comment.parentId })} className={styles.parentLink}>View parent comment</Link>}
          <details className={styles.profile}>
            <summary>
              {user.account?.type === "character" ? <MiniPortrait id={user.account.characterId} alt={identity?.name ?? user.username} size={30} /> : user.avatarUrl ? <img className={styles.avatar} src={user.avatarUrl} alt="" /> : <span className={styles.avatar} style={{ backgroundColor: user.color }} aria-hidden="true">{user.avatar}</span>}
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
              <p className={styles.activity}>{stats.comments} {stats.comments === 1 ? "comment" : "comments"} across {stats.posts} {stats.posts === 1 ? "post" : "posts"}</p>{user.profileHref && <Link href={user.profileHref}>View profile →</Link>}
              <FriendAccounts user={user} />
            </div>
          </details>
          <p className={styles.body}>{comment.body}</p>
          <LikeButton kind="raven" id={comment.id} />
          <Composer kind="raven" entryId={comment.entryId} parentId={comment.id} />
          {comment.canEdit && <ContentActions kind="raven" id={comment.id} body={comment.body} />}
          {children.length > 0 && (
            <button type="button" className={styles.replyToggle} aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
              {expanded ? "Hide" : "Show"} {descendantCount} {descendantCount === 1 ? "reply" : "replies"}
            </button>
          )}
      </article>
      {children.length > 0 && expanded && (
        <ol className={styles.replies} aria-label={`Replies to @${user.username}`}>
          {children.map((child) => <Comment key={child.comment.id} node={child} />)}
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
  const threads = buildCommentTree(comments)
    .map((node) => ({ node, pinned: someCommentInBranch(node, isCharacterComment) }))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));
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
    <section className={`${styles.section} ${collapsible ? styles.collapsible : ""} ${collapsible && !open ? styles.collapsed : ""}`} data-ready={community.loaded} aria-label="Gallery comments" onKeyDown={(event) => {
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
            {threads.map(({ node, pinned }) => <Comment key={node.comment.id} node={node} pinned={pinned} />)}
          </ol>
        ) : <p className={styles.intro}>The gutters are quiet. For now.</p>}
        <Composer kind="raven" entryId={entryId} />

      </div>
    </section>
  );
}
