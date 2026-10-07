"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import HubNavFrame from "@/components/the-great-game/HubNavFrame";
import { useHubData } from "@/components/the-great-game/useHubData";
import styles from "./social.module.css";

type Person = { id: string; username: string; displayName: string; avatarUrl: string | null };
type Reply = { id: string; body: string; createdAt: string; author: Person };
type SocialRun = {
  player: Person;
  streak: number;
  versusStreak: number;
  opponent: Person | null;
  lastPlayedAt: string;
};
type SocialPost = {
  matchId: string;
  completedAt: string;
  result: "win" | "draw";
  actor: Person;
  opponent: Person;
  standingDelta: number | null;
  turns: number;
  durationSeconds: number;
  streak: number;
  versusStreak: number;
  likes: number;
  liked: boolean;
  replies: Reply[];
  replyCount: number;
};

type FeedPayload = {
  viewerId: string | null;
  interactionsReady: boolean;
  runs: SocialRun[];
  posts: SocialPost[];
  error?: string;
};

function ago(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

function PersonAvatar({ person, small = false }: { person: Person; small?: boolean }) {
  const initials = (person.displayName || person.username).split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  return <span className={`${styles.avatar} ${small ? styles.avatarSmall : ""}`}>
    {person.avatarUrl ? <Image src={person.avatarUrl} alt="" width={small ? 28 : 44} height={small ? 28 : 44} unoptimized /> : <span>{initials}</span>}
  </span>;
}

function SocialActionIcon({ kind, active = false }: { kind: "like" | "reply"; active?: boolean }) {
  if (kind === "like") {
    return <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.actionIcon} data-active={active || undefined}>
      <path d="M12 20.1 4.5 13a4.9 4.9 0 0 1-.2-6.9 4.5 4.5 0 0 1 6.5.2L12 7.6l1.2-1.3a4.5 4.5 0 0 1 6.5-.2 4.9 4.9 0 0 1-.2 6.9L12 20.1Z" />
    </svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.actionIcon}>
    <path d="M9.2 7.1 4 12l5.2 4.9" />
    <path d="M4.5 12h7.8c4.6 0 7.2 2.1 7.7 6.1-.5-6.7-3.1-10.9-8.1-10.9H9.2" />
  </svg>;
}

function MatchPlayer({ person, losing = false }: { person: Person; losing?: boolean }) {
  return <Link href={`/users/${person.username}`} className={styles.matchPlayer} data-losing={losing || undefined}>
    <PersonAvatar person={person} />
    <span><strong>{person.displayName}</strong><small>@{person.username}</small></span>
  </Link>;
}

export default function GreatGameSocialPage() {
  const { data, guest } = useHubData();
  const [payload, setPayload] = useState<FeedPayload>({ viewerId: null, interactionsReady: true, runs: [], posts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replying, setReplying] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch("/api/great-game/social", { cache: "no-store" });
      const next = await response.json() as FeedPayload;
      if (!response.ok) throw Error(next.error || "The table talk could not be loaded.");
      setPayload(next);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The table talk could not be loaded.");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 30000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function act(matchId: string, action: "like" | "reply") {
    const key = `${action}:${matchId}`;
    if (pending) return;
    setPending(key);
    setError("");
    try {
      const response = await fetch("/api/great-game/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, matchId, body: action === "reply" ? drafts[matchId] ?? "" : undefined }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw Error(result.error || "The ledger refused that action.");
      if (action === "reply") {
        setDrafts(current => ({ ...current, [matchId]: "" }));
        setReplying(null);
      }
      await load(true);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The ledger refused that action.");
    } finally {
      setPending(null);
    }
  }

  return <main className={styles.page}>
    <div className={styles.backdrop} aria-hidden="true" />
    <HubNavFrame active="social" data={data} guest={guest} className={styles.navDock} />

    <header className={styles.hero}>
      <div><span className={styles.eyebrow}>The Cupbearer · Table talk</span><h1>Social</h1></div>
      <blockquote>“Win quietly if you like. The room will notice anyway.”<small>— Mara</small></blockquote>
    </header>

    <section className={styles.layout}>
      <aside className={styles.sidePanel} aria-label="Notable runs">
        <div className={styles.panelHeading}><span>On a run</span><small>Current table talk</small></div>
        {payload.runs.length ? payload.runs.map(run => <article className={styles.notable} key={run.player.id}>
          <PersonAvatar person={run.player} />
          <div className={styles.notableCopy}>
            <strong>{run.player.displayName}</strong>
            <span><b>{run.streak}</b> straight wins</span>
            {run.opponent ? <small><b>{run.versusStreak}</b> straight vs. {run.opponent.displayName}</small> : <small>No active 1v1 run</small>}
          </div>
        </article>) : <p className={styles.sideEmpty}>No one has made enough noise yet. Three straight wins will do it.</p>}
      </aside>

      <section className={styles.feed} aria-label="The Great Game social feed">
        <div className={styles.feedHeading}><div><span>From the tables</span><small>Recent rated matches</small></div>{error && <p role="alert">{error}</p>}</div>
        {loading ? <div className={styles.state}>Opening the room ledger…</div> : !payload.posts.length ? <div className={styles.state}>No finished matches yet. The room is waiting for its first story.</div> : payload.posts.map(post => <article className={styles.post} key={post.matchId}>
          <div className={styles.postTop}><span>Rated table</span><time dateTime={post.completedAt}>{ago(post.completedAt)}</time></div>

          <div className={styles.matchup}>
            <MatchPlayer person={post.actor} />
            <span className={styles.resultWord}>{post.result === "draw" ? "DREW WITH" : "BESTED"}</span>
            <MatchPlayer person={post.opponent} losing={post.result !== "draw"} />
          </div>

          <div className={styles.matchMeta}>
            <span>{post.turns} turns</span>
            <span>{Math.max(1, Math.round(post.durationSeconds / 60))} min</span>
            {post.standingDelta !== null && <span className={styles.standingMargin}>Standing {post.standingDelta > 0 ? "+" : ""}{post.standingDelta}</span>}
            {post.streak >= 3 && <strong>{post.streak}-win streak</strong>}
            {post.versusStreak >= 3 && <strong>{post.versusStreak} straight vs. {post.opponent.displayName}</strong>}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.actionButton}
              aria-label={post.liked ? `Unlike this match${post.likes ? `, ${post.likes} likes` : ""}` : `Like this match${post.likes ? `, ${post.likes} likes` : ""}`}
              aria-pressed={post.liked}
              data-active={post.liked || undefined}
              disabled={!payload.interactionsReady || pending === `like:${post.matchId}`}
              onClick={() => void act(post.matchId, "like")}
            >
              <SocialActionIcon kind="like" active={post.liked} />
              <span>{post.liked ? "Liked" : "Like"}</span>
              {post.likes > 0 && <b>{post.likes}</b>}
            </button>
            <button
              type="button"
              className={styles.actionButton}
              aria-expanded={replying === post.matchId}
              disabled={!payload.interactionsReady}
              onClick={() => setReplying(current => current === post.matchId ? null : post.matchId)}
            >
              <SocialActionIcon kind="reply" />
              <span>Reply</span>
              {post.replyCount > 0 && <b>{post.replyCount}</b>}
            </button>
          </div>

          {!!post.replies.length && <div className={styles.replies}>{post.replies.map(reply => <div className={styles.reply} key={reply.id}>
            <PersonAvatar person={reply.author} small />
            <div><p><Link href={`/users/${reply.author.username}`}>{reply.author.displayName}</Link> {reply.body}</p><time dateTime={reply.createdAt}>{ago(reply.createdAt)}</time></div>
          </div>)}</div>}

          {replying === post.matchId && <div className={styles.composer}>
            {payload.viewerId ? <>
              <textarea value={drafts[post.matchId] ?? ""} maxLength={420} rows={2} onChange={event => setDrafts(current => ({ ...current, [post.matchId]: event.target.value }))} placeholder="Reply from the rail…" aria-label={`Reply to ${post.actor.displayName}'s match`} />
              <div><small>{(drafts[post.matchId] ?? "").length}/420</small><button type="button" disabled={!drafts[post.matchId]?.trim() || pending === `reply:${post.matchId}`} onClick={() => void act(post.matchId, "reply")}>{pending === `reply:${post.matchId}` ? "Sending…" : "Send reply"}</button></div>
            </> : <p>Take a seat before joining the talk. <Link href="/login">Sign in</Link></p>}
          </div>}
        </article>)}
        {!payload.interactionsReady && <p className={styles.migrationNote}>Match activity is available, but likes and replies need the included Supabase migration before they can be used.</p>}
      </section>
    </section>
  </main>;
}
