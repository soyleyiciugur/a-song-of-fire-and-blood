"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GreatGameOnlineMatchView } from "@/lib/the-great-game/online";
import { seatPresence, turnElapsedMs, turnWarning, type SeatPresence } from "@/lib/the-great-game/table-tempo";
import styles from "./TableTempo.module.css";

// Preserve the server-time anchor when the spectator changes perspective.
const clockSamples = new Map<string, { sample?: string; serverTime: number; received: number }>();

export default function TableTempo({ match, spectator }: { match: GreatGameOnlineMatchView; spectator: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [now, setNow] = useState<number | null>(null);
  const [away, setAway] = useState(false);
  const [peer, setPeer] = useState<SeatPresence | null>(null);
  const [returned, setReturned] = useState(false);
  const manualAway = useRef(false);
  const publish = useRef<() => void>(() => {});
  const ownId = (match.playerId === "player1" ? match.host : match.guest)?.id;
  const opponent = match.playerId === "player1" ? match.guest : match.host;
  const active = match.status === "active" && !match.state?.winner;
  const clock = match.state?.turnClock;

  useEffect(() => {
    if (!active || !clock) return;
    let anchor = clockSamples.get(match.id);
    if (!anchor || anchor.sample !== match.serverNow) {
      const serverTime = match.serverNow ? Date.parse(match.serverNow) : Date.now();
      anchor = { sample: match.serverNow, serverTime: Number.isFinite(serverTime) ? serverTime : Date.now(), received: performance.now() };
      clockSamples.set(match.id, anchor);
      if (clockSamples.size > 20) clockSamples.delete(clockSamples.keys().next().value!);
    }
    const { serverTime, received } = anchor;
    const tick = () => setNow(serverTime + performance.now() - received);
    const initial = setTimeout(tick, 0);
    const interval = setInterval(() => { if (!document.hidden) tick(); }, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearTimeout(initial); clearInterval(interval); document.removeEventListener("visibilitychange", tick); };
  }, [active, clock, match.serverNow, match.id]);

  useEffect(() => {
    if (spectator || !active || !ownId || !opponent?.id) return;
    let disposed = false;
    let subscribed = false;
    let seenPeer = false;
    let stable: SeatPresence | null = null;
    let candidate: SeatPresence | null = null;
    let settle: ReturnType<typeof setTimeout> | undefined;
    let returnTimer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase.channel(`great-game-presence:${match.id}`, { config: { presence: { key: ownId } } });
    const commit = (next: SeatPresence) => {
      if (disposed) return;
      if (next !== 'missing') seenPeer = true;
      if (next === 'missing' && !seenPeer) return;
      if (next === stable) return;
      const cameBack = stable !== null && stable !== 'here' && next === 'here';
      stable = next;
      setPeer(next);
      setReturned(cameBack);
      clearTimeout(returnTimer);
      if (cameBack) returnTimer = setTimeout(() => { if (!disposed) setReturned(false); }, 5000);
    };
    const sync = () => {
      const next = seatPresence(channel.presenceState<{ away?: boolean }>()[opponent.id] ?? []);
      if (next === candidate) return;
      candidate = next;
      clearTimeout(settle);
      // Ignore brief tab switches and websocket reconnects. Returning is immediate.
      if (next === 'here') commit(next);
      else settle = setTimeout(() => commit(next), 10_000);
    };
    const track = () => {
      if (subscribed && !disposed) void channel.track({ away: manualAway.current || document.hidden });
    };
    publish.current = track;
    channel.on('presence', { event: 'sync' }, sync).subscribe(status => {
      subscribed = status === 'SUBSCRIBED';
      if (subscribed) track();
      else if (!disposed) { clearTimeout(settle); candidate = null; stable = null; setPeer(null); setReturned(false); }
    });
    document.addEventListener('visibilitychange', track);
    return () => {
      disposed = true; publish.current = () => {};
      clearTimeout(settle); clearTimeout(returnTimer);
      document.removeEventListener('visibilitychange', track);
      void supabase.removeChannel(channel);
    };
  }, [supabase, match.id, ownId, opponent?.id, spectator, active]);

  if (!active) return null;
  const elapsed = clock && now !== null ? turnElapsedMs(clock, now) : null;
  const seconds = elapsed === null ? null : Math.floor(elapsed / 1000);
  const warning = elapsed === null ? 0 : turnWarning(elapsed);
  const ruler = match.state?.activePlayerId === match.playerId && !spectator ? 'Your' : (match.state?.activePlayerId === 'player1' ? match.host.displayName : match.guest?.displayName || 'Opponent') + "'s";
  return <section className={styles.tempo} aria-label="Table pace and presence">
    <div className={styles.row}>
      <span title="Elapsed ruler turn. Paused during mandatory effects. Reminders only; no automatic penalty." className={styles.clock} data-warning={warning || undefined}>
        {match.state?.phase !== 'playing' ? 'Preparing the table' : seconds === null ? 'Timer starts next move' : <>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} <small>{clock?.runningSince ? 'elapsed' : 'paused'}</small></>}
      </span>
      {!spectator && <button type="button" aria-pressed={away} title={away ? 'Return to the table' : 'Tell your opponent you are briefly away'} onClick={() => {
        manualAway.current = !manualAway.current; setAway(manualAway.current); publish.current();
      }}>{away ? 'Return' : 'Step away'}</button>}
    </div>
    {warning > 0 && <p role="status" className={styles.warning}>{ruler} turn has reached {warning} seconds. No time penalty.</p>}
    {!spectator && <p role="status" className={styles.presence}>
      {away && <span>Your seat is kept warm. No surrender or timeout. </span>}{returned ? `${opponent?.displayName} returns to the table.` : peer === 'away' ? `${opponent?.displayName} has stepped away. Their seat is kept warm.` : peer === 'missing' ? `${opponent?.displayName}'s presence is unavailable. This is not a timeout.` : peer === null ? 'Table presence reconnecting...' : 'Both rulers are at the table.'}
    </p>}
  </section>;
}
