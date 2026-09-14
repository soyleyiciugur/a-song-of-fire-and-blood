"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import EmojiPicker from "./EmojiPicker";
import { QUICK_REACTIONS } from "./emojiData";
import styles from "./direct-raven.module.css";

type ReactionRow = { user_id: string; reaction: string };
type ReactorProfile = { id: string; display_name: string; username: string; avatar_url: string | null };

export default function MessageReactions({ messageId, userId }: { messageId: string; userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<ReactionRow[]>([]);
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState<{ emoji: string; users: ReactorProfile[] } | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const suppressClick = useRef(false);

  const refresh = useCallback(async () => {
    const { data, error: loadError } = await supabase.from("member_likes").select("user_id,reaction").eq("target_kind", "message").eq("target_id", messageId);
    if (!loadError) setRows(((data ?? []) as ReactionRow[]).map((row) => ({ ...row, reaction: row.reaction || "❤️" })));
  }, [messageId, supabase]);

  useEffect(() => {
    let active = true;
    const run = () => { if (active && document.visibilityState === "visible") void refresh(); };
    run();
    const timer = window.setInterval(run, 15000);
    document.addEventListener("visibilitychange", run);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", run); };
  }, [refresh]);
  useEffect(() => {
    if (!open && !details) return;
    const close = (event: PointerEvent) => { if (!wrapRef.current?.contains(event.target as Node)) { setOpen(false); setCustomOpen(false); setDetails(null); } };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); setCustomOpen(false); setDetails(null); } };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [open, details]);

  const mine = rows.find((row) => row.user_id === userId)?.reaction ?? null;
  const summary = [...rows.reduce((map, row) => map.set(row.reaction, (map.get(row.reaction) ?? 0) + 1), new Map<string, number>())];


  const cancelLongPress = () => {
    if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  async function showWhoReacted(emoji: string) {
    cancelLongPress();
    suppressClick.current = true;
    const ids = rows.filter((row) => row.reaction === emoji).map((row) => row.user_id);
    if (!ids.length) return;
    const { data } = await supabase.from("profiles").select("id,display_name,username,avatar_url").in("id", ids);
    const profiles = ((data ?? []) as ReactorProfile[]).sort((a, b) => a.display_name.localeCompare(b.display_name));
    setDetails({ emoji, users: profiles });
    setOpen(false);
    setCustomOpen(false);
    window.setTimeout(() => { suppressClick.current = false; }, 0);
  }

  async function choose(reaction: string) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const { error: saveError } = await supabase.rpc("set_message_reaction", { target: messageId, reaction });
      if (saveError) throw saveError;
      await refresh();
      setOpen(false); setCustomOpen(false);
    } catch (caught) {
      console.error("Could not save message reaction", caught);
      setError("Could not save reaction.");
    } finally { setBusy(false); }
  }

  return <span ref={wrapRef} className={styles.messageReactionWrap}>
    <button type="button" className={`${styles.messageReactionTrigger} ${mine ? styles.messageReactionActive : ""}`} aria-label="React to message" aria-expanded={open} onClick={() => { setOpen((value) => !value); setCustomOpen(false); }}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><path d="M12 20.2 5.4 14a5.1 5.1 0 0 1-.5-6.7 4.5 4.5 0 0 1 7.1-.2 4.5 4.5 0 0 1 7.1.2 5.1 5.1 0 0 1-.5 6.7L12 20.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
    {summary.length > 0 && <span className={styles.messageReactionSummary}>{summary.slice(0, 4).map(([emoji, count]) => <button key={emoji} type="button" onPointerDown={() => { cancelLongPress(); longPressTimer.current = window.setTimeout(() => void showWhoReacted(emoji), 450); }} onPointerUp={cancelLongPress} onPointerCancel={cancelLongPress} onPointerLeave={cancelLongPress} onContextMenu={(event) => { event.preventDefault(); void showWhoReacted(emoji); }} onClick={() => { if (suppressClick.current) return; void choose(emoji); }} aria-label={`${emoji} ${count}. Hold to see who reacted.`}>{emoji}<small>{count}</small></button>)}</span>}
    {details && <span className={styles.reactionDetailsPopover} onPointerDown={(event) => event.stopPropagation()}>
      <span className={styles.reactionDetailsTitle}>{details.emoji}<small>{details.users.length} {details.users.length === 1 ? "reaction" : "reactions"}</small></span>
      <span className={styles.reactionDetailsList}>{details.users.map((profile) => <span key={profile.id} className={styles.reactionDetailsUser}>
        <span className={styles.reactionDetailsAvatar}>{profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : profile.display_name.slice(0, 2).toUpperCase()}</span>
        <span><b>{profile.display_name}</b><small>@{profile.username}</small></span>
      </span>)}</span>
    </span>}
    {open && <span className={styles.quickReactionPopover} onPointerDown={(event) => event.stopPropagation()}>
      <span className={styles.quickReactionRow}>{QUICK_REACTIONS.map((emoji) => <button key={emoji} type="button" disabled={busy} className={mine === emoji ? styles.quickReactionSelected : ""} onClick={() => void choose(emoji)}>{emoji}</button>)}<button type="button" className={styles.moreReactionButton} onClick={() => setCustomOpen((value) => !value)} aria-label="More reactions"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></button></span>
      {customOpen && <span className={styles.customReactionPicker}><EmojiPicker compact onSelect={(emoji) => void choose(emoji)} /></span>}
      {error && <small className={styles.reactionError}>{error}</small>}
    </span>}
  </span>;
}
