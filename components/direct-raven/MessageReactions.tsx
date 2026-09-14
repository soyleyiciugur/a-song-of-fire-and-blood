"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import EmojiPicker from "./EmojiPicker";
import { QUICK_REACTIONS } from "./emojiData";
import styles from "./direct-raven.module.css";

type ReactionRow = { user_id: string; reaction: string };

export default function MessageReactions({ messageId, userId }: { messageId: string; userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<ReactionRow[]>([]);
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const wrapRef = useRef<HTMLSpanElement>(null);

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
    if (!open) return;
    const close = (event: PointerEvent) => { if (!wrapRef.current?.contains(event.target as Node)) { setOpen(false); setCustomOpen(false); } };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); setCustomOpen(false); } };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [open]);

  const mine = rows.find((row) => row.user_id === userId)?.reaction ?? null;
  const summary = [...rows.reduce((map, row) => map.set(row.reaction, (map.get(row.reaction) ?? 0) + 1), new Map<string, number>())];

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
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><path d="M12 20.5s-7-4.3-7-10A4.5 4.5 0 0 1 12 6.8a4.5 4.5 0 0 1 7 3.7c0 5.7-7 10-7 10Z" stroke="currentColor" strokeWidth="1.45"/><path d="M8.7 11.2h.01M15.3 11.2h.01M9.5 14c.7.8 1.5 1.2 2.5 1.2s1.8-.4 2.5-1.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
    </button>
    {summary.length > 0 && <span className={styles.messageReactionSummary}>{summary.slice(0, 4).map(([emoji, count]) => <button key={emoji} type="button" onClick={() => void choose(emoji)} aria-label={`${emoji} ${count}`}>{emoji}<small>{count}</small></button>)}</span>}
    {open && <span className={styles.quickReactionPopover} onPointerDown={(event) => event.stopPropagation()}>
      <span className={styles.quickReactionRow}>{QUICK_REACTIONS.map((emoji) => <button key={emoji} type="button" disabled={busy} className={mine === emoji ? styles.quickReactionSelected : ""} onClick={() => void choose(emoji)}>{emoji}</button>)}<button type="button" className={styles.moreReactionButton} onClick={() => setCustomOpen((value) => !value)} aria-label="More reactions"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></button></span>
      {customOpen && <span className={styles.customReactionPicker}><EmojiPicker compact onSelect={(emoji) => void choose(emoji)} /></span>}
      {error && <small className={styles.reactionError}>{error}</small>}
    </span>}
  </span>;
}
