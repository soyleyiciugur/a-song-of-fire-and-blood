"use client";

import { useId, useState } from "react";
import { getGutterComments, getGutterUserStats, gutterUserMap, type GutterComment } from "@/lib/fleaBottom";
import styles from "./gutterComments.module.css";

function Comment({ comment, replies }: { comment: GutterComment; replies: GutterComment[] }) {
  const user = gutterUserMap.get(comment.authorId);
  if (!user) return null;
  const stats = getGutterUserStats(user.id);
  return (
    <li className={styles.comment}>
      <article>
        <details className={styles.profile}>
          <summary>
            <span className={styles.avatar} style={{ backgroundColor: user.color }} aria-hidden="true">{user.avatar}</span>
            <span className={styles.username}>@{user.username}</span>
            <span className={styles.profileHint}>profile</span>
          </summary>
          <div className={styles.bio}>
            {(user.displayName || user.pronouns) && (
              <div className={styles.profileIdentity}>
                {user.displayName && <strong>{user.displayName}</strong>}
                {user.pronouns && <span>{user.pronouns}</span>}
              </div>
            )}
            <span className={styles.badge}>{user.kind === "fictional" ? "Fictional regular" : "Community member"}</span>
            <p>{user.bio}</p>
            {(user.location || user.current) && (
              <dl className={styles.profileFacts}>
                {user.location && <div><dt>Based in</dt><dd>{user.location}</dd></div>}
                {user.current && <div><dt>{user.current.label}</dt><dd>{user.current.value}</dd></div>}
              </dl>
            )}
            <p className={styles.activity}>{stats.comments} {stats.comments === 1 ? "comment" : "comments"} across {stats.posts} {stats.posts === 1 ? "post" : "posts"}</p>
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
  const comments = getGutterComments(entryId);
  const [open, setOpen] = useState(!collapsible);
  const panelId = useId();
  const roots = comments.filter((comment) => comment.parentId === null);
  return (
    <section className={`${styles.section} ${collapsible ? styles.collapsible : ""}`} aria-label="Flea Bottom comments" onKeyDown={(event) => {
      if (event.key !== "Escape") event.stopPropagation();
    }}>
      {collapsible ? (
        <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
          <span>Gutter talk · {comments.length}</span><span>{open ? "Close" : "Read comments"}</span>
        </button>
      ) : <h2 className={styles.heading}>Gutter talk <span>{comments.length}</span></h2>}
      <div id={panelId} hidden={!open} className={collapsible ? styles.reelPanel : undefined}>
        <p className={styles.intro}>The usual suspects. Fictional regulars, very real bad takes.</p>
        {roots.length ? (
          <ol className={styles.thread}>
            {roots.map((comment) => <Comment key={comment.id} comment={comment} replies={comments.filter((reply) => reply.parentId === comment.id)} />)}
          </ol>
        ) : <p className={styles.intro}>The gutters are quiet. For now.</p>}
        <p className={styles.footer}>Member accounts & comments are coming later. For now, meet the regulars.</p>
      </div>
    </section>
  );
}
