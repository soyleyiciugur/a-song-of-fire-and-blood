"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import rawCards from "@/data/the-great-game/cards.json";
import styles from "./decks.module.css";

type CardType = "character" | "dragon" | "event" | "artifact" | "location";
type Ability = { id: string; name: string; trigger: string; text: string };
type Card = {
  id: string; cardType: CardType; tierId: string; name: string; subtitle?: string;
  houseId?: string; cost: number; power?: number; influence?: number; health?: number;
  traits: string[]; abilities: Ability[]; roles?: string[]; deckable?: boolean;
  linkedCharacterId?: string; balanceStatus?: string;
};
type Deck = { id: string; name: string; cards: Record<string, number>; updatedAt: number };

const ALL = rawCards as Card[];
const STORAGE_KEY = "the-great-game:decks:v1";
const MAX_DECK = 30;
const MAX_COPIES = 2;
const LABEL: Record<CardType | "all", string> = {
  all: "All Cards", character: "Characters", dragon: "Dragons",
  event: "Events", artifact: "Artifacts", location: "Locations",
};
const TIER_RANK: Record<string, number> = { "s-plus": 0, s: 1, a: 2, b: 3, c: 4 };

function titleCase(value: string) {
  return value.split("-").filter(Boolean).map(x => x[0].toUpperCase() + x.slice(1)).join(" ");
}
function makeDeck(name = "New Deck"): Deck {
  return { id: `deck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, cards: {}, updatedAt: Date.now() };
}
function countDeck(deck: Deck | null) {
  return deck ? Object.values(deck.cards).reduce((a, b) => a + b, 0) : 0;
}
function artCandidates(card: Card) {
  const exts = ["webp", "png", "jpg", "jpeg"];
  const result: string[] = [];
  if (card.cardType === "character") {
    const id = card.linkedCharacterId ?? card.id;
    exts.forEach(ext => result.push(`/images/characters/${id}.${ext}`));
  }
  if (card.cardType === "dragon") {
    exts.forEach(ext => result.push(`/images/dragons/${card.id}.${ext}`));
  }
  exts.forEach(ext => result.push(`/images/cards/${card.id}.${ext}`));
  return result;
}
function CardArt({ card, className }: { card: Card; className?: string }) {
  const candidates = useMemo(() => artCandidates(card), [card]);
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [card.id]);
  if (index >= candidates.length) return <div className={`${styles.artFallback} ${className ?? ""}`}>✦</div>;
  return <img src={candidates[index]} alt="" className={className} draggable={false} onError={() => setIndex(i => i + 1)} />;
}

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<CardType | "all">("all");
  const [tier, setTier] = useState("all");
  const [house, setHouse] = useState("all");
  const [sort, setSort] = useState("cost");
  const [inspect, setInspect] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Deck[];
      if (saved.length) { setDecks(saved); setSelectedId(saved[0].id); }
      else { const d = makeDeck("First Deck"); setDecks([d]); setSelectedId(d.id); }
    } catch {
      const d = makeDeck("First Deck"); setDecks([d]); setSelectedId(d.id);
    }
  }, []);

  useEffect(() => {
    if (decks.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    else localStorage.removeItem(STORAGE_KEY);
  }, [decks]);

  const selected = decks.find(d => d.id === selectedId) ?? null;
  const total = countDeck(selected);
  const houses = useMemo(() => Array.from(new Set(ALL.map(c => c.houseId).filter(Boolean) as string[])).sort(), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL
      .filter(c => c.deckable !== false)
      .filter(c => type === "all" || c.cardType === type)
      .filter(c => tier === "all" || c.tierId === tier)
      .filter(c => house === "all" || c.houseId === house)
      .filter(c => !q || [c.name, c.subtitle, c.houseId, c.cardType, ...c.traits, ...(c.roles ?? []), ...c.abilities.flatMap(a => [a.name, a.text, a.trigger])].filter(Boolean).join(" ").toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "tier") return (TIER_RANK[a.tierId] ?? 99) - (TIER_RANK[b.tierId] ?? 99) || a.name.localeCompare(b.name);
        if (sort === "type") return a.cardType.localeCompare(b.cardType) || a.name.localeCompare(b.name);
        return a.cost - b.cost || a.name.localeCompare(b.name);
      });
  }, [query, type, tier, house, sort]);

  const inspected = ALL.find(c => c.id === inspect) ?? null;
  const curve = useMemo(() => {
    const values = Array(11).fill(0) as number[];
    if (selected) Object.entries(selected.cards).forEach(([id, copies]) => {
      const card = ALL.find(c => c.id === id);
      if (card) values[Math.min(10, card.cost)] += copies;
    });
    return values;
  }, [selected]);
  const curveMax = Math.max(1, ...curve);

  function updateSelected(fn: (d: Deck) => Deck) {
    if (!selectedId) return;
    setDecks(ds => ds.map(d => d.id === selectedId ? { ...fn(d), updatedAt: Date.now() } : d));
  }
  function addCard(card: Card) {
    if (!selected || total >= MAX_DECK) return;
    const copies = selected.cards[card.id] ?? 0;
    if (copies >= MAX_COPIES) return;
    updateSelected(d => ({ ...d, cards: { ...d.cards, [card.id]: copies + 1 } }));
  }
  function removeCard(id: string) {
    if (!selected) return;
    updateSelected(d => {
      const next = { ...d.cards };
      if ((next[id] ?? 0) <= 1) delete next[id];
      else next[id] -= 1;
      return { ...d, cards: next };
    });
  }
  function newDeck() {
    const d = makeDeck(`Deck ${decks.length + 1}`);
    setDecks(ds => [...ds, d]); setSelectedId(d.id); setRenaming(true);
  }
  function deleteDeck() {
    if (!selectedId) return;
    const next = decks.filter(d => d.id !== selectedId);
    setDecks(next); setSelectedId(next[0]?.id ?? null); setRenaming(false);
  }
  function duplicateDeck() {
    if (!selected) return;
    const d = { ...selected, id: `deck-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, name: `${selected.name} Copy`, cards: { ...selected.cards }, updatedAt: Date.now() };
    setDecks(ds => [...ds, d]); setSelectedId(d.id);
  }

  return (
    <main className={styles.page}>
      <div className={styles.backdrop} aria-hidden />
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>The Great Game</span>
          <h1>Decks &amp; Collection</h1>
          <p>Study every card in the realm, assemble thirty-card decks, and keep each list ready for the wars to come.</p>
        </div>
        <nav className={styles.gameNav}>
          <Link href="/cards">Cards</Link>
          <Link href="/cards/decks" className={styles.activeNav}>Decks</Link>
          <Link href="/cards/play">Play</Link>
        </nav>
      </header>

      <section className={styles.workspace}>
        <aside className={styles.deckRail}>
          <div className={styles.railHeader}><div><span>Your Decks</span><strong>{decks.length}</strong></div><button onClick={newDeck}>+ New</button></div>
          <div className={styles.deckList}>
            {decks.map(deck => (
              <button key={deck.id} onClick={() => { setSelectedId(deck.id); setRenaming(false); }} className={`${styles.deckListItem} ${deck.id === selectedId ? styles.deckListItemActive : ""}`}>
                <span>{deck.name}</span><small>{countDeck(deck)}/{MAX_DECK}</small>
              </button>
            ))}
            {!decks.length && <button className={styles.emptyDeckPrompt} onClick={newDeck}>Create your first deck</button>}
          </div>
        </aside>

        <section className={styles.collection}>
          <div className={styles.collectionHeader}>
            <div><span className={styles.kicker}>The Collection</span><h2>All Cards</h2><small>{filtered.length} shown · {ALL.filter(c => c.deckable !== false).length} deckable</small></div>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search cards, abilities, houses..." />
          </div>
          <div className={styles.filters}>
            <select value={type} onChange={e => setType(e.target.value as CardType | "all")}>{Object.entries(LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select>
            <select value={tier} onChange={e => setTier(e.target.value)}><option value="all">All Tiers</option><option value="s-plus">S+ Tier</option><option value="s">S Tier</option><option value="a">A Tier</option><option value="b">B Tier</option><option value="c">C Tier</option></select>
            <select value={house} onChange={e => setHouse(e.target.value)}><option value="all">All Houses</option>{houses.map(h => <option key={h} value={h}>{titleCase(h)}</option>)}</select>
            <select value={sort} onChange={e => setSort(e.target.value)}><option value="cost">Sort: Command</option><option value="name">Sort: Name</option><option value="tier">Sort: Tier</option><option value="type">Sort: Type</option></select>
          </div>

          <div className={styles.cardGrid}>
            {filtered.map(card => {
              const copies = selected?.cards[card.id] ?? 0;
              return <article className={styles.card} data-tier={card.tierId} key={card.id}>
                <button className={styles.cardMain} onClick={() => setInspect(card.id)}>
                  <CardArt card={card} className={styles.cardArt} />
                  <div className={styles.cardShade} />
                  <span className={styles.cost}>{card.cost}</span>
                  <span className={styles.typeBadge}>{LABEL[card.cardType]} · {card.tierId.toUpperCase()}</span>
                  <div className={styles.cardText}>
                    <h3>{card.name}</h3>{card.subtitle && <small>{card.subtitle}</small>}
                    {(card.cardType === "character" || card.cardType === "dragon") && <div className={styles.stats}>
                      <span><b>{card.power ?? 0}</b> PWR</span>
                      {card.cardType === "character" && <span><b>{card.influence ?? 0}</b> INF</span>}
                      <span><b>{card.health ?? 0}</b> HP</span>
                    </div>}
                    <div className={styles.traits}>{card.traits.filter(t => !["unique","dragon"].includes(t)).slice(0,3).map(t => <span key={t}>{titleCase(t)}</span>)}</div>
                    {card.abilities[0] && <p><strong>{card.abilities[0].name}</strong>{card.abilities[0].text}</p>}
                  </div>
                </button>
                <div className={styles.cardActions}>
                  <button disabled={!copies} onClick={() => removeCard(card.id)}>−</button><span>{copies}/{MAX_COPIES}</span>
                  <button disabled={!selected || total >= MAX_DECK || copies >= MAX_COPIES} onClick={() => addCard(card)}>+</button>
                </div>
              </article>;
            })}
          </div>
        </section>

        <aside className={styles.builder}>
          {selected ? <>
            <div className={styles.builderHeader}>
              <span className={styles.kicker}>Deck Workshop</span>
              {renaming ? <input className={styles.nameInput} autoFocus value={selected.name} onChange={e => updateSelected(d => ({...d, name:e.target.value.slice(0,48)}))} onBlur={() => setRenaming(false)} onKeyDown={e => e.key === "Enter" && setRenaming(false)} /> :
                <button className={styles.nameButton} onClick={() => setRenaming(true)}>{selected.name} <span>✎</span></button>}
              <div className={styles.deckMeta}><strong className={total === MAX_DECK ? styles.complete : ""}>{total}/{MAX_DECK}</strong><span>cards</span></div>
            </div>
            <div className={styles.curve}>{curve.map((n,i) => <div className={styles.curveCol} key={i}><div><i style={{height:`${n/curveMax*100}%`}} /></div><span>{i===10?"10+":i}</span><small>{n}</small></div>)}</div>
            <div className={styles.deckEntries}>
              {Object.entries(selected.cards).map(([id,copies]) => ({card:ALL.find(c=>c.id===id),copies})).filter(x=>x.card).sort((a,b)=>(a.card!.cost-b.card!.cost)||a.card!.name.localeCompare(b.card!.name)).map(({card,copies}) => <div className={styles.deckEntry} key={card!.id}>
                <button className={styles.deckEntryMain} onClick={() => setInspect(card!.id)}><span>{card!.cost}</span><b>{card!.name}</b><em>×{copies}</em></button>
                <button onClick={() => removeCard(card!.id)}>−</button>
              </div>)}
              {!total && <div className={styles.emptyBuilder}><span>✦</span><strong>An empty council table.</strong><p>Add cards from the collection to begin.</p></div>}
            </div>
            <div className={styles.builderFooter}><button onClick={duplicateDeck}>Duplicate</button><button className={styles.deleteButton} onClick={deleteDeck}>Delete</button></div>
          </> : <div className={styles.noDeck}><span>✦</span><h2>No deck selected</h2><button onClick={newDeck}>Create Deck</button></div>}
        </aside>
      </section>

      {inspected && <div className={styles.modalBackdrop} onMouseDown={() => setInspect(null)}>
        <article className={styles.modal} onMouseDown={e => e.stopPropagation()}>
          <button className={styles.close} onClick={() => setInspect(null)}>×</button>
          <div className={styles.modalArtWrap}><CardArt card={inspected} className={styles.modalArt} /><div className={styles.modalShade}/><span className={styles.modalCost}>{inspected.cost}</span></div>
          <div className={styles.modalContent}>
            <span className={styles.kicker}>{LABEL[inspected.cardType]} · {inspected.tierId.toUpperCase()}</span>
            <h2>{inspected.name}</h2>{inspected.subtitle && <p className={styles.subtitle}>{inspected.subtitle}</p>}
            {(inspected.cardType === "character" || inspected.cardType === "dragon") && <div className={styles.modalStats}>
              <span><b>{inspected.power ?? 0}</b><small>Power</small></span>{inspected.cardType==="character"&&<span><b>{inspected.influence ?? 0}</b><small>Influence</small></span>}<span><b>{inspected.health ?? 0}</b><small>Health</small></span>
            </div>}
            <div className={styles.modalTraits}>{inspected.traits.map(t=><span key={t}>{titleCase(t)}</span>)}{inspected.houseId&&<span>{titleCase(inspected.houseId)}</span>}</div>
            <div className={styles.abilities}>{inspected.abilities.length ? inspected.abilities.map(a=><section key={a.id}><span>{titleCase(a.trigger)}</span><h3>{a.name}</h3><p>{a.text}</p></section>) : <p>No special ability.</p>}</div>
            {inspected.balanceStatus === "provisional" && <div className={styles.provisional}>Balance values are provisional.</div>}
            <button className={styles.modalAdd} disabled={!selected || total>=MAX_DECK || (selected.cards[inspected.id]??0)>=MAX_COPIES} onClick={()=>addCard(inspected)}>Add to {selected?.name ?? "Deck"}</button>
          </div>
        </article>
      </div>}
    </main>
  );
}
