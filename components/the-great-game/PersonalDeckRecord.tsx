"use client";
import controls from "./CardsControls.module.css";
import type {MatchScope} from "@/lib/the-great-game/match-types";
import { useEffect, useState } from "react";
import { deckCards, deckSignature, type DeckRecord } from "@/lib/the-great-game/deck-records";
import type { StoredDeck } from "@/lib/the-great-game/stored-decks";
import styles from "@/app/cards/decks/decks.module.css";
export default function PersonalDeckRecord({ deck }: { deck: StoredDeck }) {
  const [scope,setScope]=useState<MatchScope>("total");
  const [byType,setByType]=useState<{custom:DeckRecord[];ranked:DeckRecord[]}>({custom:[],ranked:[]});
  const [records, setRecords] = useState<DeckRecord[] | null>(null);
  const [error, setError] = useState("");
  const [unlinked, setUnlinked] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/great-game/deck-stats", { signal: controller.signal, cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Deck records are unavailable.");
      setRecords(data.records); setByType(data.byType??{custom:[],ranked:data.records}); setUnlinked(data.unlinkedGames);
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, []);
  let signature = "";
  try { signature = deckSignature(deckCards(deck)); } catch { /* Invalid saved quantities have no matching record. */ }
  const record = (scope==="total"?records:byType[scope])?.find(record => record.signature === signature);
  return <section className={styles.personalRecord} aria-label="Personal deck statistics">
    <strong>Your record with this roster</strong><nav className={controls.tabs} aria-label="Deck match statistics">{(["total","custom","ranked"] as const).map(type=><button key={type} aria-pressed={scope===type} onClick={()=>setScope(type)}>{type.charAt(0).toUpperCase()+type.slice(1)}</button>)}</nav>
    {error ? <p role="status">{error}</p> : !records ? <p>Opening your deck ledger...</p> : <>
      <dl><div><dt>Matches</dt><dd>{record?.games ?? 0}</dd></div><div><dt>Wins</dt><dd>{record?.wins ?? 0}</dd></div><div><dt>Losses</dt><dd>{record?.losses ?? 0}</dd></div><div><dt>Win rate</dt><dd>{record?.games ? `${record.winRate}%` : "—"}</dd></div></dl>
      <small>{record?.draws ?? 0} draws · {record?.abandons ?? 0} abandoned (counted as losses). Completed online matches only.</small>
      <small>Tracks this exact card roster across renames. Changing cards starts a separate record.</small>
      {unlinked > 0 && <small>{unlinked} older matches have no saved roster and cannot be assigned to a deck.</small>}
    </>}
  </section>;
}
