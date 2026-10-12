import type { GameState } from './types';

export type TurnClock = { turn: number; elapsedMs: number; runningSince: string | null };
export function turnElapsedMs(clock: TurnClock, now: number): number {
  const start = clock.runningSince ? Date.parse(clock.runningSince) : NaN;
  return Math.max(0, clock.elapsedMs) + (Number.isFinite(start) ? Math.max(0, now - start) : 0);
}
/** Called only by the authenticated action route, never by a client action payload. */
export function advanceTurnClock(before: GameState, after: GameState, now: number): TurnClock | undefined {
  if (after.phase !== 'playing' && after.phase !== 'finished') return undefined;
  const previous = before.turnClock;
  const sameTurn = previous?.turn === after.turnNumber;
  const elapsedMs = sameTurn ? turnElapsedMs(previous, now) : 0;
  const running = after.phase === 'playing' && !after.winner && !after.pendingEffect;
  return { turn: after.turnNumber, elapsedMs, runningSince: running ? new Date(now).toISOString() : null };
}
export function turnWarning(elapsedMs: number): 0 | 60 | 90 {
  return elapsedMs >= 90_000 ? 90 : elapsedMs >= 60_000 ? 60 : 0;
}
export type SeatPresence = 'here' | 'away' | 'missing';
export function seatPresence(entries: { away?: boolean }[]): SeatPresence {
  if (!entries.length) return 'missing';
  return entries.some(entry => entry.away === false) ? 'here' : entries.some(entry=>entry.away===true)?'away':'missing';
}
