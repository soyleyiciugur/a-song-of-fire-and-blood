"use client";
import { useCallback,useEffect, useRef, useState } from "react";
import controls from "@/components/the-great-game/CardsControls.module.css";
import Link from "next/link";
import { playerTierLabel } from "@/components/the-great-game/PlayerTierGem";
import type { GreatGameHistoryRow } from "@/lib/supabase/database.types";
import styles from "./ranks.module.css";
type Row = Pick<GreatGameHistoryRow, "season_display_name" | "match_type" | "match_id" | "opponent_username" | "opponent_display_name" | "result" | "rating_before" | "rating_after" | "completed_at">;
type Cursor = {before: string; match: string} | null;
export default function RankHistory() {
  const [rows, setRows] = useState<Row[]>([]);
  const [next, setNext] = useState<Cursor>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guest, setGuest] = useState(false);
  const request = useRef<AbortController | null>(null);
  const load=useCallback(async (cursor: Cursor) => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setLoading(true); setError(""); if(!cursor) {setRows([]);setNext(null);}
    try {
      const response = await fetch('/api/great-game/rank-history?' + new URLSearchParams({...cursor}), { signal: controller.signal, cache: 'no-store' });
      if (response.status === 401) { setGuest(true); return; }
      const payload = await response.json();
      if (!response.ok) throw Error(payload.error || 'The record could not be loaded.');
      if (controller.signal.aborted) return;
      setGuest(false);
      setRows(previous => cursor ? [...previous, ...payload.rows.filter((row: Row) => !previous.some(item => item.match_id === row.match_id))] : payload.rows);
      setNext(payload.next);
    } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'The record could not be loaded.'); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  },[]);
  useEffect(() => { const initial = setTimeout(() => void load(null), 0); return () => { clearTimeout(initial); request.current?.abort(); }; }, [load]);
  return <section className={styles.historyPanel} aria-label="Your rank history">
    <h2>Your rank history</h2>
    <p>Crown matches and their rating changes. Friendly tables do not appear here. Historical leaderboard positions were not recorded.</p>
    {guest ? <p>Sign in to see your own record.</p> : <>
      {!loading && !error && !rows.length && <p>No completed matches yet. Your first result will begin this record.</p>}
      <ol className={styles.historyList}>{rows.map(row => {
        const delta = row.rating_after - row.rating_before;
        const before = playerTierLabel(row.rating_before), after = playerTierLabel(row.rating_after);
        return <li key={row.match_id}>
          <div><time dateTime={row.completed_at}>{new Date(row.completed_at).toLocaleString('en-GB', { timeZone: 'Europe/Istanbul', dateStyle: 'medium', timeStyle: 'short' })}</time><small>{row.season_display_name??"Crown"}</small><strong>{row.result === 'abandon' ? 'Abandoned' : row.result === 'win' ? 'Victory' : row.result === 'loss' ? 'Defeat' : 'Draw'}</strong><span>vs <Link href={'/users/' + encodeURIComponent(row.opponent_username)}>{row.opponent_display_name || row.opponent_username}</Link></span></div>
          <div className={styles.historyRating}><strong>{row.rating_before} &rarr; {row.rating_after}</strong><span data-gain={delta > 0} data-loss={delta < 0}>{delta > 0 ? '+' : ''}{delta} rating</span><small>Tier {before === after ? after : `${before} → ${after}`}</small></div>
        </li>;
      })}</ol>
      <p className={styles.historyNote}>Dates shown in Istanbul time.</p>
      {error && <p role="alert">{error}</p>}
      {loading ? <p role="status">Opening the record...</p> : error ? <button className={controls.button} onClick={() => void load(rows.length ? next : null)}>Retry</button> : next && <button className={controls.button} onClick={() => void load(next)}>Older matches</button>}
    </>}
  </section>;
}
