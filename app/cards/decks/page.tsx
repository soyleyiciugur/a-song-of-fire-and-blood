"use client";

import { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import HubNavFrame from "@/components/the-great-game/HubNavFrame";
import { useHubData } from "@/components/the-great-game/useHubData";
import UtilityIcon from "@/components/nav/UtilityIcon";
import { GameCardFace, GameCardModal } from "@/components/cards/GameCardFace";
import { getAllGameCards, isUnique } from "@/lib/the-great-game/cards";
import { DECK_STORAGE_KEY, readStoredDecks } from "@/lib/the-great-game/stored-decks";
import type { GameCard } from "@/lib/the-great-game/types";
import styles from "./decks.module.css";

type CardType = "character" | "dragon" | "event" | "artifact" | "location";
type Card = GameCard & { balanceStatus?: string };
type Deck = { id: string; name: string; cards: Record<string, number>; updatedAt: number };

const ALL = getAllGameCards() as Card[];
const STORAGE_KEY = DECK_STORAGE_KEY;
const MAX_DECK = 30;
const MAX_COPIES = 2;
const LABEL: Record<CardType | "all", string> = {
  all: "All Cards", character: "Characters", dragon: "Dragons",
  event: "Events", artifact: "Artifacts", location: "Locations",
};
const TIER_RANK: Record<string, number> = { "s-plus": 0, s: 1, a: 2, b: 3, c: 4 };

type FilterOption = { value: string; label: string };

function FilterMenu({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const selected = options.find(option => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const frame = requestAnimationFrame(() => {
      const options = rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
      (rootRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]') ?? options?.[0])?.focus();
    });

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`${styles.filterMenu} ${open ? styles.filterMenuOpen : ""}`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); return; }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (!open) { setOpen(true); return; }
      const items = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
      const current = items.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.filterTrigger}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen(current => !current)}
      >
        <span>{selected?.label ?? value}</span>
        <svg className={styles.filterChevron} width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div id={listId} className={styles.filterOptions} role="listbox" aria-label={ariaLabel}>
          {options.map(option => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={option.value === value ? styles.filterOptionActive : undefined}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
                triggerRef.current?.focus();
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function titleCase(value: string) {
  return value.split("-").filter(Boolean).map(x => x[0].toLocaleUpperCase("tr-TR") + x.slice(1)).join(" ");
}
function makeDeck(name = "New Deck"): Deck {
  return { id: `deck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, cards: {}, updatedAt: Date.now() };
}
function countDeck(deck: Deck | null) {
  return deck ? Object.values(deck.cards).reduce((a, b) => a + b, 0) : 0;
}
function DeckWorkshop() {
  const cardId = useSearchParams().get("card");
  const { data, guest } = useHubData();
  const [mobilePanel, setMobilePanel] = useState<"collection" | "builder">("collection");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<CardType | "all">("all");
  const [tier, setTier] = useState("all");
  const [house, setHouse] = useState("all");
  const [sort, setSort] = useState("cost");
  const [availability, setAvailability] = useState<"deckable" | "non-deckable">("deckable");
  const [inspect, setInspect] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = readStoredDecks();
      setDecks(saved);
      setSelectedId(saved[0]?.id ?? null);
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!cardId || !ALL.some((card) => card.id === cardId)) return;
    const timer = window.setTimeout(() => setInspect(cardId), 0);
    return () => window.clearTimeout(timer);
  }, [cardId]);

  useEffect(() => {
    if (!loaded) return;
    let message = "";
    try {
      if (decks.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
      else localStorage.removeItem(STORAGE_KEY);
    } catch { message = "Your browser could not save this deck. Keep this page open and make space in browser storage."; }
    const timer = window.setTimeout(() => setSaveError(message), 0);
    return () => window.clearTimeout(timer);
  }, [decks, loaded]);

  const selected = decks.find(d => d.id === selectedId) ?? null;
  const total = countDeck(selected);
  const houses = useMemo(() => Array.from(new Set(ALL.map(c => c.houseId).filter((house): house is string => Boolean(house) && house !== "-"))).sort(), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL
      .filter(c => availability === "non-deckable" ? c.deckable === false : c.deckable !== false)
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
  }, [query, type, tier, house, sort, availability]);

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
    if (!selected || card.deckable === false || total >= MAX_DECK) return;
    const copies = selected.cards[card.id] ?? 0;
    if (copies >= (isUnique(card) ? 1 : MAX_COPIES)) return;
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
    setDecks(ds => [...ds, d]); setSelectedId(d.id); setRenaming(true); setConfirmDelete(false); setMobilePanel("builder");
  }
  function deleteDeck() {
    if (!selectedId) return;
    const next = decks.filter(d => d.id !== selectedId);
    setDecks(next); setSelectedId(next[0]?.id ?? null); setRenaming(false); setConfirmDelete(false);
  }
  function duplicateDeck() {
    if (!selected) return;
    const d = { ...selected, id: `deck-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, name: `${selected.name} Copy`, cards: { ...selected.cards }, updatedAt: Date.now() };
    setDecks(ds => [...ds, d]); setSelectedId(d.id);
  }

  return (
    <main className={styles.page}>
      <div className={styles.backdrop} aria-hidden />
      <HubNavFrame active="decks" data={data} guest={guest} className={styles.navDock} />
      <header className={styles.hero}>
        <div><span className={styles.eyebrow}>The Cupbearer · Deck workshop</span><h1>Prepare your hand.</h1></div>
        <p>“Thirty cards. Make every one earn its place.”<small>— Mara</small></p>
      </header>
      <div className={styles.mobileTabs} role="tablist" aria-label="Deck workshop view">
        <button role="tab" aria-selected={mobilePanel === "collection"} onClick={() => setMobilePanel("collection")}>Cards</button>
        <button role="tab" aria-selected={mobilePanel === "builder"} onClick={() => setMobilePanel("builder")}>Your deck <span>{total}/30</span></button>
      </div>
      <section className={styles.workspace} data-panel={mobilePanel} aria-label="Deck workshop">
        <aside className={styles.deckRail}>
          <div className={styles.railHeader}><div><span>Your decks</span><strong>{decks.length} in the satchel</strong></div><button onClick={newDeck} aria-label="Create new deck">+ New</button></div>
          <div className={styles.deckList}>
            {decks.map(deck => (
              <button key={deck.id} onClick={() => { setSelectedId(deck.id); setRenaming(false); setConfirmDelete(false); }} aria-pressed={deck.id === selectedId} className={`${styles.deckListItem} ${deck.id === selectedId ? styles.deckListItemActive : ""}`}>
                <UtilityIcon name="cards" size={24} /><span>{deck.name}<small>{countDeck(deck)}/{MAX_DECK} cards</small></span>
              </button>
            ))}
            {!decks.length && <button className={styles.emptyDeckPrompt} onClick={newDeck}>Create your first deck</button>}
          </div>
        </aside>

        <section className={styles.collection} aria-label="Card catalogue workbench">
          <div className={styles.collectionHeader}>
            <div>
              <span className={styles.kicker}>Card catalogue</span>
              <h2>{availability === "non-deckable" ? "Non-Deckable Cards" : "Deckable Cards"}</h2>
              <small>{filtered.length} shown · {availability === "non-deckable" ? ALL.filter(c => c.deckable === false).length : ALL.filter(c => c.deckable !== false).length} total</small>
            </div>
            <input type="search" aria-label="Search cards, abilities and houses" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search cards, abilities, houses..." />
          </div>
          <div className={styles.collectionTabs} role="tablist" aria-label="Card availability">
            <button type="button" role="tab" aria-selected={availability === "deckable"} className={availability === "deckable" ? styles.collectionTabActive : undefined} onClick={() => setAvailability("deckable")}>Deckable</button>
            <button type="button" role="tab" aria-selected={availability === "non-deckable"} className={availability === "non-deckable" ? styles.collectionTabActive : undefined} onClick={() => setAvailability("non-deckable")}>Non-Deckable</button>
          </div>
          <div className={styles.filters}>
            <FilterMenu
              value={type}
              ariaLabel="Filter by card type"
              onChange={value => setType(value as CardType | "all")}
              options={Object.entries(LABEL).map(([value, label]) => ({ value, label }))}
            />
            <FilterMenu
              value={tier}
              ariaLabel="Filter by tier"
              onChange={setTier}
              options={[
                { value: "all", label: "All Tiers" },
                { value: "s-plus", label: "S+ Tier" },
                { value: "s", label: "S Tier" },
                { value: "a", label: "A Tier" },
                { value: "b", label: "B Tier" },
                { value: "c", label: "C Tier" },
              ]}
            />
            <FilterMenu
              value={house}
              ariaLabel="Filter by house"
              onChange={setHouse}
              options={[
                { value: "all", label: "All Houses" },
                ...houses.map(value => ({ value, label: titleCase(value) })),
              ]}
            />
            <FilterMenu
              value={sort}
              ariaLabel="Sort cards"
              onChange={setSort}
              options={[
                { value: "cost", label: "Sort: Command" },
                { value: "name", label: "Sort: Name" },
                { value: "tier", label: "Sort: Tier" },
                { value: "type", label: "Sort: Type" },
              ]}
            />
          </div>

          <div className={styles.cardGrid} aria-label="Card collection">
            {!filtered.length && <div className={styles.emptyResults}><UtilityIcon name="cards" size={38} /><h3>No cards on this table.</h3><p>Try another search or loosen your filters.</p><button onClick={() => { setQuery(""); setType("all"); setTier("all"); setHouse("all"); }}>Clear filters</button></div>}
            {filtered.map(card => {
              const copies = selected?.cards[card.id] ?? 0;
              const copyLimit = isUnique(card) ? 1 : MAX_COPIES;
              return <GameCardFace key={card.id} card={card} onSelect={setInspect} actions={card.deckable === false ? (
                  <div className={`${styles.cardActions} ${styles.nonDeckableActions}`}><span>NON-DECKABLE</span></div>
                ) : (
                  <div className={styles.cardActions}>
                    <button aria-label={`Remove ${card.name} from deck`} disabled={!copies} onClick={() => removeCard(card.id)}>−</button><span>{copies}/{copyLimit}</span>
                    <button aria-label={`Add ${card.name} to deck`} disabled={!selected || total >= MAX_DECK || copies >= copyLimit} onClick={() => addCard(card)}>+</button>
                  </div>
                )} />;
            })}
          </div>
        </section>

        <aside className={styles.builder}>
          {selected ? <>
            <div className={styles.builderHeader}>
              <span className={styles.kicker}>On your table</span>
              {renaming ? <input aria-label="Deck name" className={styles.nameInput} autoFocus value={selected.name} onChange={e => updateSelected(d => ({...d, name:e.target.value.slice(0,48)}))} onBlur={() => setRenaming(false)} onKeyDown={e => e.key === "Enter" && setRenaming(false)} /> :
                <button aria-label="Rename deck" className={styles.nameButton} onClick={() => setRenaming(true)}>{selected.name} <span>✎</span></button>}
              <div className={styles.deckMeta}><strong className={total === MAX_DECK ? styles.complete : ""}>{total}/{MAX_DECK}</strong><span>cards</span></div>
            </div>
            <div className={styles.curveHeading}><span>Command curve</span><small>Plan your opening hand</small></div>
            <div className={styles.curve} aria-label="Cards by Command cost">{curve.map((n,i) => <div className={styles.curveCol} key={i} aria-label={`${i === 10 ? "10 or more" : i} Command: ${n} cards`}><div><i style={{height:`${n/curveMax*100}%`}} /></div><span>{i===10?"10+":i}</span><small>{n}</small></div>)}</div>
            <div className={styles.deckEntries}>
              {Object.entries(selected.cards).map(([id,copies]) => ({card:ALL.find(c=>c.id===id),copies})).filter(x=>x.card).sort((a,b)=>(a.card!.cost-b.card!.cost)||a.card!.name.localeCompare(b.card!.name)).map(({card,copies}) => <div className={styles.deckEntry} key={card!.id}>
                <button className={styles.deckEntryMain} onClick={() => setInspect(card!.id)}><span>{card!.cost}</span><b>{card!.name}</b><em>×{copies}</em></button>
                <button aria-label={`Remove ${card!.name} from deck`} onClick={() => removeCard(card!.id)}>−</button>
              </div>)}
              {!total && <div className={styles.emptyBuilder}><span>✦</span><strong>An empty council table.</strong><p>Add cards from the catalogue to begin.</p></div>}
            </div>
            <div className={styles.saveStatus} role="status">{saveError || (loaded ? "Saved in this browser" : "Opening your satchel…")}</div>
            <div className={styles.builderFooter}>{confirmDelete ? <div className={styles.deleteConfirm} role="group" aria-label="Confirm deck deletion"><p>Remove “{selected.name}” from your satchel?</p><button onClick={() => setConfirmDelete(false)}>Keep deck</button><button className={styles.deleteButton} onClick={deleteDeck}>Remove deck</button></div> : <><button onClick={duplicateDeck}>Duplicate</button><button className={styles.deleteButton} onClick={() => setConfirmDelete(true)}>Delete</button></>}</div>
          </> : <div className={styles.noDeck}><span>✦</span><h2>No deck selected</h2><button onClick={newDeck}>Create Deck</button></div>}
        </aside>
      </section>

      {inspected && <GameCardModal card={inspected} onClose={() => setInspect(null)} action={<button className={styles.modalAdd} disabled={inspected.deckable === false || !selected || total>=MAX_DECK || (selected.cards[inspected.id]??0)>=(isUnique(inspected) ? 1 : MAX_COPIES)} onClick={()=>addCard(inspected)}>{inspected.deckable === false ? "Non-deckable" : `Add to ${selected?.name ?? "Deck"}`}</button>} />}
    </main>
  );
}

export default function DecksPage() {
  return <Suspense fallback={<main className={styles.page}><p className={styles.saveStatus}>Opening your satchel…</p></main>}><DeckWorkshop /></Suspense>;
}
