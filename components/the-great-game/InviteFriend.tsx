"use client";
import MatchTypePicker from "./MatchTypePicker";
import type {MatchType} from "@/lib/the-great-game/match-types";
import CardsSelect from "@/components/the-great-game/CardsSelect";
import { deckCards, validateStoredDeck } from "@/lib/the-great-game/deck-records";
import DeckValidationNotice from "./DeckValidationNotice";
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
  const [matchType,setMatchType]=useState<MatchType>("custom");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [table, setTable] = useState<GreatGameOnlineMatchView | null>(null);
  const lock = useRef(false);
  const validation = validateStoredDeck(decks.find(deck => deck.id === deckId));
  async function send() {
    if (lock.current || (!table && !validation.valid)) return;
    lock.current = true; setBusy(true); setError("");
    try {
      let match = table;
      if (!match) {
        const deck = decks.find(deck => deck.id === deckId);
        const response = await fetch("/api/great-game", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "create", matchType, deckName: deck?.name ?? "Practice Deck", deck: deckCards(deck) }) });
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
      <label>Your deck<CardsSelect ariaLabel="Your deck" value={deckId} onChange={onDeckChange} disabled={busy||!!table} options={[...(!decks.some(deck=>deck.id==="practice")?[{value:"practice",label:"Practice Deck"}]:[]),...decks.map(deck=>({value:deck.id,label:deck.name}))]} /></label>
      {!table && <DeckValidationNotice validation={validation} editLink />}
      <MatchTypePicker value={matchType} onChange={setMatchType} disabled={busy||!!table} /><label>A note with your invitation<textarea value={message} onChange={event => setMessage(event.target.value)} maxLength={600} rows={3} disabled={busy} placeholder="Fancy a game?" /></label>
      {table && <GameInvitation code={table.code} />}
      {error && <p role="alert">{error}</p>}
      <button className={styles.primary} disabled={busy || (!table && !validation.valid)}><RavenIcon size={18} /> {busy ? "Sending your raven…" : "Send invitation"}</button>
      {table && <small>Your table is open. Retry the raven, or go back to the waiting table.</small>}
    </form>
  </ParchmentDialog>;
}
