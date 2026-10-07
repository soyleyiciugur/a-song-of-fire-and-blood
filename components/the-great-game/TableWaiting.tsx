"use client";
import { useState } from "react";
import type { GreatGameOnlineMatchView } from "@/lib/the-great-game/online";
import ParchmentDialog, { ParchmentNote } from "./ParchmentDialog";
import UtilityIcon from "@/components/nav/UtilityIcon";
import styles from "./play-hub.module.css";

export default function TableWaiting({ match, busy, inviteCopied, onCopyInvite, onLeave, error }: {
  match: GreatGameOnlineMatchView; busy: boolean; inviteCopied: boolean;
  onCopyInvite: () => void; onLeave: () => void; error?: string | null;
}) {
  const [confirm, setConfirm] = useState(false);
  return <main className={`${styles.hub} ${styles.parchmentTable}`}>
    <section className={styles.waiting}>
      <div className={styles.tableCrest}><UtilityIcon name="cards" size={30} /></div><span className={styles.eyebrow}>The Cupbearer · Private table</span>
      <h1>Waiting for a worthy rival</h1>
      <ParchmentNote>Table&apos;s ready. Send your friend this invitation; I&apos;ll keep the fire going.</ParchmentNote>
      <strong className={styles.tableCode} aria-label={`Table code ${match.code}`}>{match.code}</strong>
      <div className={styles.resultActions}><button className={styles.primary} onClick={onCopyInvite} disabled={busy}>{inviteCopied ? "Invitation copied" : "Copy Invite Link"}</button><button className={styles.secondary} onClick={() => setConfirm(true)} disabled={busy}>Back to the inn</button></div>
      <small>The game begins when your friend takes their seat.</small>
      {error && <p role="alert">{error}</p>}
    </section>
    {confirm && <ParchmentDialog title="Leave this table?" onClose={() => { if (!busy) setConfirm(false); }}><ParchmentNote speaker="aldren">I can clear the table, my liege. This invitation will no longer admit a guest.</ParchmentNote>{error && <p role="alert">{error}</p>}<button className={styles.primary} onClick={onLeave} disabled={busy}>{busy ? "Clearing the table…" : "Close table & return"}</button></ParchmentDialog>}
  </main>;
}
