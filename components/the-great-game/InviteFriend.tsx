"use client";
import { useRef, useState } from "react";
import type { HubFriend } from "@/lib/the-great-game/hub";
import type { StoredDeck } from "@/lib/the-great-game/stored-decks";
import type { GreatGameOnlineMatchView } from "@/lib/the-great-game/online";
import ParchmentDialog, { ParchmentNote } from "./ParchmentDialog";
import RavenIcon from "@/components/direct-raven/RavenIcon";
import GameInvitation from "@/components/direct-raven/GameInvitation";
import styles from "./play-hub.module.css";

export default function InviteFriend({ friend, decks, deckId, onDeckChange, onClose, onInvited }: {
  friend: HubFriend; decks: StoredDeck[]; deckId: string; onDeckChange: (id: string) => void;
  onClose: () => void; onInvited: (match: GreatGameOnlineMatchView) => void;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [table, setTable] = useState<GreatGameOnlineMatchView | null>(null);
  const lock = useRef(false);
  async function send() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      let match = table;
      if (!match) {
        const deck = decks.find(deck => deck.id === deckId);
        const response = await fetch("/api/great-game", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "create", deckName: deck?.name ?? "Practice Deck", deck: deck ? Object.entries(deck.cards).flatMap(([id, count]) => Array.from({ length: Math.max(0, count) }, () => id)) : undefined }) });
        const payload = await response.json();
        if (!response.ok || !payload.match) throw Error(payload.error || "The table could not be opened.");
        match = payload.match as GreatGameOnlineMatchView; setTable(match);
      }
      const response = await fetch("/api/great-game/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matchId: match.id, username: friend.username, message }) });
      const payload = await response.json();
      if (!response.ok) throw Error(payload.error || "The raven could not be sent.");
      void fetch("/api/notifications/direct-raven", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: payload.messageId }) }).catch(() => {});
      onInvited(match);
    } catch (error) { setError(error instanceof Error ? error.message : "The raven could not be sent."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <ParchmentDialog title={`Invite ${friend.display_name || friend.username}`} onClose={() => { if (!busy) { if (table) onInvited(table); else onClose(); } }}>
    <ParchmentNote>Choose your deck. I&apos;ll keep a seat for your friend.</ParchmentNote>
    <form className={styles.inviteForm} onSubmit={event => { event.preventDefault(); void send(); }}>
      <label>Your deck<select value={deckId} onChange={event => onDeckChange(event.target.value)} disabled={busy || !!table}>{!decks.some(deck => deck.id === "practice") && <option value="practice">Practice Deck</option>}{decks.map(deck => <option key={deck.id} value={deck.id}>{deck.name}</option>)}</select></label>
      <label>A note with your invitation<textarea value={message} onChange={event => setMessage(event.target.value)} maxLength={600} rows={3} disabled={busy} placeholder="Fancy a game?" /></label>
      {table && <GameInvitation code={table.code} />}
      {error && <p role="alert">{error}</p>}
      <button className={styles.primary} disabled={busy}><RavenIcon size={18} /> {busy ? "Sending your raven…" : "Send invitation"}</button>
      {table && <small>Your table is open. Retry the raven, or go back to the waiting table.</small>}
    </form>
  </ParchmentDialog>;
}
