"use client";
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {getAllGameCards,findGameCard} from '@/lib/the-great-game/cards';
import {matchesMetadata,matchesOwnership,ownedQuantity,type MetadataSelection,type OwnershipFilter as Ownership} from '@/lib/the-great-game/card-metadata';
import {GameCardFace,GameCardModal} from '@/components/cards/GameCardFace';
import HubNavFrame from './HubNavFrame';
import {useHubData} from './useHubData';
import {useCardCollection} from './useCardCollection';
import MetadataFilters,{MetadataBadges} from './MetadataFilters';
import OwnershipFilter,{CollectionNotice} from './OwnershipFilter';
import CardsSelect from './CardsSelect';
import controls from './CardsControls.module.css';
import styles from '@/app/cards/encyclopedia/encyclopedia.module.css';
const cards=getAllGameCards();
const SAVED_FILTER_KEY='tgg:satchel:default-filters:v1';
type SavedFilters={ownership:Ownership;type:string;query:string;metadata:MetadataSelection};

export default function CardCollection({initialCard}:{initialCard?:string}){
 const {data,guest,error}=useHubData();const collection=useCardCollection(guest?null:data?.profile.id);
 const [ownership,setOwnership]=useState<Ownership>('owned');const [metadata,setMetadata]=useState<MetadataSelection>({});
 const [query,setQuery]=useState('');const [type,setType]=useState('');const [inspect,setInspect]=useState<string|null>(null);
 const [hasDefault,setHasDefault]=useState(false);const [filterNotice,setFilterNotice]=useState('');
 useEffect(()=>{try{const raw=localStorage.getItem(SAVED_FILTER_KEY);if(!raw)return;const saved=JSON.parse(raw) as Partial<SavedFilters>;
 if(saved.ownership==='all'||saved.ownership==='owned'||saved.ownership==='unowned')setOwnership(saved.ownership);
 if(typeof saved.query==='string')setQuery(saved.query);if(typeof saved.type==='string')setType(saved.type);
 if(saved.metadata&&typeof saved.metadata==='object')setMetadata(saved.metadata);setHasDefault(true);
 }catch{ /* A stale preference must not prevent browsing. */ }},[]);
 const saveDefault=()=>{try{localStorage.setItem(SAVED_FILTER_KEY,JSON.stringify({ownership,type,query,metadata} satisfies SavedFilters));setHasDefault(true);setFilterNotice('Default Satchel filters saved on this device.');}catch{setFilterNotice('Your browser could not save the default filters.');}};
 const clearDefault=()=>{try{localStorage.removeItem(SAVED_FILTER_KEY);setHasDefault(false);setFilterNotice('Saved default cleared.');}catch{setFilterNotice('Your browser could not clear the preference.');}};
 
 useEffect(()=>{if(!initialCard)return;const timer=setTimeout(()=>setInspect(initialCard),0);return ()=>clearTimeout(timer);},[initialCard]);
 const filtered=useMemo(()=>cards.filter(card=>(!type||type===card.cardType)&&matchesMetadata(card,metadata)&&(ownership==='all'||collection.status==='ready')&&matchesOwnership(card.id,ownership,collection.quantities)&&[card.name,card.subtitle,card.houseId,...card.traits,...card.abilities.flatMap(a=>[a.name,a.text])].join(' ').toLowerCase().includes(query.trim().toLowerCase())),[query,type,metadata,ownership,collection.quantities,collection.status]);
 const selected=inspect?findGameCard(inspect):undefined;
 return <main className={`${styles.page} great-game-page`}><HubNavFrame active="satchel" data={data} guest={guest}/><header className={styles.hero} data-great-game-heading><span className={styles.eyebrow}>The Cupbearer · Your card collection</span><h1>Your Satchel</h1><p>Your collected cards, kept close at hand. While the Store is closed, all deckable cards remain freely usable in Decks and matches.</p></header><div className={controls.toolbar}><label className={controls.field}>Search<input type="search" placeholder="Card, ability, house..." value={query} onChange={e=>setQuery(e.target.value)}/></label><OwnershipFilter value={ownership} onChange={setOwnership} collection={collection}/><label className={controls.field}>Card type<CardsSelect ariaLabel="Card type" value={type} onChange={setType} options={[{value:'',label:'All Types'},...['character','dragon','event','artifact','location'].map(value=>({value,label:value[0].toUpperCase()+value.slice(1)}))]}/></label><MetadataFilters items={cards} value={metadata} onChange={setMetadata}/><div className={styles.filterSave}><button type="button" className={controls.button} onClick={saveDefault}>Save filters as default</button>{hasDefault&&<button type="button" className={controls.button} onClick={clearDefault}>Clear saved default</button>}{filterNotice&&<small role="status">{filterNotice}</small>}</div></div>{error?<p role="status">{error}</p>:<CollectionNotice collection={collection} retry={collection.retry}/>}<p className={styles.resultCount} role="status">{filtered.length} cards shown{collection.status==='ready'?' · '+Object.values(collection.quantities).reduce((sum,n)=>sum+n,0)+' owned copies':''}</p><div className={styles.cards}>{filtered.map(card=><GameCardFace key={card.id} card={card} onSelect={setInspect} actions={<span className={styles.cardLabel}>{card.name}<br/>{collection.status==='ready'?(ownedQuantity(card.id,collection.quantities)?'Owned × '+ownedQuantity(card.id,collection.quantities):'Unowned'):'Ownership unavailable'}<MetadataBadges item={card}/></span>}/>)}</div>{!filtered.length&&(collection.status==='ready'||ownership==='all')&&<p>{ownership==='owned'&&!Object.keys(collection.quantities).length?'Your satchel is empty. Deck-building access is unchanged.':'No cards match these filters.'} <button className={controls.button} onClick={()=>{setOwnership('all');setQuery('');setType('');setMetadata({});}}>Browse all cards</button></p>}{selected&&<GameCardModal card={selected} onClose={()=>setInspect(null)} action={<Link className={controls.button} href={'/cards/decks?card='+encodeURIComponent(selected.id)}>Find in Deck Workshop</Link>}/>}</main>;
}
