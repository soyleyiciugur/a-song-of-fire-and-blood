"use client";
import MetadataFilters, {MetadataBadges} from '@/components/the-great-game/MetadataFilters';
import OwnershipFilter, {CollectionNotice} from '@/components/the-great-game/OwnershipFilter';
import {useCardCollection} from '@/components/the-great-game/useCardCollection';
import {matchesMetadata,matchesOwnership,type MetadataSelection,type OwnershipFilter as Ownership} from '@/lib/the-great-game/card-metadata';
import {CONTEXTUAL_RULES} from "@/lib/the-great-game/contextual-rules";
import CardsSelect from "@/components/the-great-game/CardsSelect";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllGameCards, findGameCard } from '@/lib/the-great-game/cards';
import { KEYWORD_RULES, STATUS_RULES } from '@/lib/the-great-game/glossary';
import { GameCardFace, GameCardModal } from '@/components/cards/GameCardFace';
import { TraitIcon } from '@/components/cards/GameCardPrimitives';
import HubNavFrame from '@/components/the-great-game/HubNavFrame';
import { useHubData } from '@/components/the-great-game/useHubData';
import type { AbilityTrigger, Trait } from '@/lib/the-great-game/types';
import controls from '@/components/the-great-game/CardsControls.module.css';
import styles from './encyclopedia.module.css';

const ruleArtwork: Record<string, string> = {
  unique: 'unique', Grounded: 'grounded', Fall: 'fall',
  Exhausted: 'exhausted', Deployed: 'deployed',
  fall: 'fall', arrival: 'arrival', events: 'event',
  Exchange: 'exchange', turn1: 'turn1', turn2: 'turn2',
};
function RuleArtwork({ name }: { name: string }) {
  const artwork = ruleArtwork[name];
  return artwork ? <span className={styles.ruleIcon}><Image src={`/images/cards/keywords/${artwork}.webp`} alt="" width={26} height={26} unoptimized /></span> : null;
}

const contextualTraitPairs: Record<string, { traits: [Trait, Trait]; separator: string }> = {
  guard: { traits: ['guard', 'challenge'], separator: 'x' },
  intrigue: { traits: ['intrigue', 'confront'], separator: 'x' },
  'swift-schemer': { traits: ['swift', 'schemer'], separator: '&' },
};
function ContextualTraitIcons({ id, trait }: { id: string; trait?: Trait }) {
  const pair = contextualTraitPairs[id];
  if (pair) return <span className={styles.ruleIconPair}><span className={styles.ruleIcon}><TraitIcon trait={pair.traits[0]} /></span><span>{pair.separator}</span><span className={styles.ruleIcon}><TraitIcon trait={pair.traits[1]} /></span></span>;
  return trait ? <span className={styles.ruleIcon}><TraitIcon trait={trait} /></span> : null;
}

const cards = getAllGameCards();
const keywords = Object.entries(KEYWORD_RULES) as [Trait, string][];
const turnRules = [
  { name: 'Exchange', text: 'One Exchange comprises exactly two Turns: first Player 1, then Player 2. The Exchange number only advances after both rulers have acted. Existing match logs retain their per-turn engine indexes.' },
  { name: 'Turn', text: 'A Turn belongs to one ruler. Each ruler has one Turn per Exchange: your Turn and your opponent’s Turn. Effects that say start or end of your turn refer to your own Turn. In Exchange 1, Player 1 takes their first Turn, then Player 2 takes their first Turn. In Exchange 2, both players take their second Turns.' },
  { name: 'Command', text: 'Command pays for cards. The displayed cost includes active discounts and increases. Unspent Command normally clears at the end of your ruler turn; specific card effects can change this.' },
];


const abilityRules: { trigger: AbilityTrigger; name: string; text: string }[] = [
  { trigger: 'arrival', name: 'Arrival', text: 'Resolves when the card enters play, following its ability text.' },
  { trigger: 'fall', name: 'Fall', text: 'Resolves when the card is destroyed. Returning a card to hand does not trigger Fall.' },
  { trigger: 'victory', name: 'Victory', text: 'Resolves when the card meets its stated Conflict victory or enemy destruction condition.' },
  { trigger: 'start-of-turn', name: 'Start of Turn', text: 'Resolves at the start of the ruler turn specified by the ability, subject to its conditions.' },
  { trigger: 'end-of-turn', name: 'End of Turn', text: 'Resolves at the end of the ruler turn specified by the ability, subject to its conditions.' },
  { trigger: 'passive', name: 'Passive', text: 'Provides an ongoing effect or responds to the conditions described in its text. Read the ability for its exact timing and duration.' },
  { trigger: 'event', name: 'Effect', text: 'The effect of an Event card resolves when it is played with legal targets, following the card text.' },
  { trigger: 'bond', name: 'Bond', text: 'Provides the stated benefit when the named character or other bond condition is present.' },
];

export default function Encyclopedia() {
  const { data, guest } = useHubData();
  const collection=useCardCollection(guest?null:data?.profile.id);
  const [metadata,setMetadata]=useState<MetadataSelection>({});
  const [ownership,setOwnership]=useState<Ownership>('all');
  const [tab, setTab] = useState<'cards' | 'rules'>('cards');
  const [query, setQuery] = useState('');
  const [trait, setTrait] = useState('');
  const [type, setType] = useState('');
  const [inspect, setInspect] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => cards.filter(card =>
    matchesMetadata(card,metadata) && (ownership==="all"||collection.status==="ready") && matchesOwnership(card.id,ownership,collection.quantities) &&
    (!trait || card.traits.includes(trait as Trait)) && (!type || card.cardType === type) &&
    (!q || [card.name, card.subtitle, card.cardType, card.houseId, ...card.traits, ...card.abilities.flatMap(a => [a.name, a.text, a.trigger])].join(' ').toLowerCase().includes(q))
  ).sort((a, b) => a.name.localeCompare(b.name)), [q, trait, type, metadata,ownership,collection.status,collection.quantities]);
  const selected = inspect ? findGameCard(inspect) : undefined;
  const matches = (name: string, text: string) => (name + ' ' + text).toLowerCase().includes(q);
  const rules = keywords.filter(([name, text]) => matches(name, text));
  const statuses = Object.entries(STATUS_RULES).filter(([name, text]) => matches(name, text[0]));
  const abilities = abilityRules.filter(rule => matches(rule.name, rule.text));
  const turns = turnRules.filter(rule => matches(rule.name, rule.text));
  const contextual = CONTEXTUAL_RULES.filter(rule=>matches([rule.name,...rule.aliases,...rule.cards.map(id=>findGameCard(id)?.name??id)].join(" "),rule.text+" "+rule.example));

  return <main className={`${styles.page} great-game-page`}>
    <HubNavFrame active="encyclopedia" data={data} guest={guest} />
    <header className={styles.hero} data-great-game-heading><span className={styles.eyebrow}>The Cupbearer · Card reference</span><h1>Card Encyclopedia</h1><p>The cards, their traits, and the rules of the table.</p></header>
    <nav className={`${controls.tabs} ${styles.encyclopediaTabs}`} aria-label="Encyclopedia view">
      <button aria-pressed={tab === 'cards'} onClick={() => { setTab('cards'); setQuery(''); }}>Cards</button>
      <button aria-pressed={tab === 'rules'} onClick={() => { setTab('rules'); setQuery(''); }}>Traits &amp; Rules</button>
    </nav>
    <div className={controls.toolbar}>
      <label className={`${controls.field} ${styles.search}`}>Search<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={tab === 'cards' ? 'Card, ability, house...' : 'Trait or rule...'} /></label>
      {tab === 'cards' && <><OwnershipFilter value={ownership} onChange={setOwnership} collection={collection}/><MetadataFilters items={cards} value={metadata} onChange={setMetadata}/><label className={controls.field}>Card type<CardsSelect ariaLabel="Card type" value={type} onChange={setType} options={[{value:"",label:"All Types"},...["character","dragon","event","artifact","location"].map(value=>({value,label:value.charAt(0).toUpperCase()+value.slice(1)}))]} /></label><label className={controls.field}>Trait<CardsSelect ariaLabel="Trait" value={trait} onChange={setTrait} options={[{value:"",label:"All Traits"},...keywords.map(([value])=>({value,label:value.charAt(0).toUpperCase()+value.slice(1)}))]} /></label></>}
    </div>
    {tab === 'cards' ? <>
      <CollectionNotice collection={collection} retry={collection.retry}/><p className={styles.resultCount} role="status">{filtered.length} cards · Includes summons and non-deckable cards</p>
      <div className={styles.cards}>{filtered.map(card => <GameCardFace key={card.id} card={card} onSelect={setInspect} actions={<span className={styles.cardLabel}>{card.name}{card.deckable === false ? ' · Non-deckable' : ''}<MetadataBadges item={card}/></span>} />)}</div>
      {!filtered.length && <p>No cards match these filters. <button className={controls.button} onClick={() => { setQuery(''); setTrait(''); setType(''); setOwnership('all'); setMetadata({}); }}>Clear filters</button></p>}
    </> : <section aria-label="Trait glossary" className={styles.rules}>
      {turns.length > 0 && <section className={styles.ruleGroup} aria-labelledby="turn-rules"><h2 id="turn-rules">Exchanges, Turns &amp; Command</h2><dl>{turns.map(rule => <div className={styles.ruleRow} key={rule.name}><dt><span className={styles.ruleIconSlot} aria-hidden="true"><RuleArtwork name={rule.name} />{rule.name === 'Turn' && <span className={styles.ruleIconPair} aria-hidden="true"><RuleArtwork name="turn1" /><span>x</span><RuleArtwork name="turn2" /></span>}{rule.name === 'Command' && <span className={styles.ruleIcon}><Image src="/images/cards/command-gems/command.webp" alt="" width={26} height={26} unoptimized /></span>}</span><span>{rule.name}</span></dt><dd>{rule.text}</dd></div>)}</dl></section>}
      {statuses.length > 0 && <section className={styles.ruleGroup} aria-labelledby="status-rules"><h2 id="status-rules">Unit states</h2><dl>{statuses.map(([name, text]) => <div className={styles.ruleRow} key={name}><dt><span className={styles.ruleIconSlot} aria-hidden="true"><RuleArtwork name={name} /></span><span>{name}</span></dt><dd>{text[0]}</dd></div>)}</dl></section>}
      {rules.length > 0 && <section className={styles.ruleGroup} aria-labelledby="keyword-rules"><h2 id="keyword-rules">Card traits</h2><dl>{rules.map(([name, text]) => <div className={styles.ruleRow} key={name}><dt><span className={styles.ruleIconSlot} aria-hidden="true">{ruleArtwork[name] ? <RuleArtwork name={name} /> : <span className={styles.ruleIcon}><TraitIcon trait={name} /></span>}</span><span>{name.replace(/\b\w/g, (letter) => letter.toUpperCase())}</span></dt><dd><p>{text}</p><button className={styles.relatedCards} onClick={() => { setTrait(name); setType(''); setQuery(''); setMetadata({}); setOwnership('all'); setTab('cards'); }}>View cards with the {name.replace(/\b\w/g, (letter) => letter.toUpperCase())} trait <span aria-hidden="true">→</span></button></dd></div>)}</dl></section>}
      {abilities.length > 0 && <section className={styles.ruleGroup} aria-labelledby="ability-rules"><h2 id="ability-rules">Ability Types</h2><dl>{abilities.map(rule => <div className={styles.ruleRow} key={rule.trigger}><dt><span className={styles.ruleIconSlot} aria-hidden="true"><RuleArtwork name={rule.trigger} /></span><span>{rule.name}</span></dt><dd>{rule.text}</dd></div>)}</dl></section>}
      {contextual.length>0&&<section className={styles.ruleGroup} aria-labelledby="context-rules"><h2 id="context-rules">Mechanics in context</h2><dl>{contextual.map(rule=><div className={styles.ruleRow} key={rule.id}><dt><span className={styles.ruleIconSlot} aria-hidden="true"><RuleArtwork name={rule.id} /><ContextualTraitIcons id={rule.id} trait={rule.trait} /></span><span>{rule.name}</span></dt><dd>{rule.review&&<strong className={styles.reviewLabel}>For rules review</strong>}<p>{rule.text}</p><p className={styles.example}><strong>Example: </strong>{rule.example}</p><div className={styles.references}>{rule.cards.map(id=><button key={id} className={styles.relatedCards} onClick={()=>setInspect(id)}>View {findGameCard(id)?.name??id}</button>)}</div></dd></div>)}</dl></section>}
      {!rules.length && !statuses.length && !turns.length && !abilities.length && !contextual.length && <p>No matching rules.</p>}
    </section>}
    {selected && <GameCardModal card={selected} onClose={() => setInspect(null)} action={<Link className={controls.button} href={'/cards/decks?card=' + encodeURIComponent(selected.id)}>Find in Deck Workshop</Link>} />}
  </main>;
}
