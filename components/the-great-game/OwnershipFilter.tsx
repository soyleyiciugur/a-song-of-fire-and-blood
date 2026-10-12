"use client";
import Link from 'next/link';
import type {OwnershipFilter as Filter} from '@/lib/the-great-game/card-metadata';
import type {CollectionState} from './useCardCollection';
import controls from './CardsControls.module.css';
export default function OwnershipFilter({value,onChange,collection}:{value:Filter;onChange:(value:Filter)=>void;collection:CollectionState}){
 const choices:[Filter,string][]=[['all','All'],['owned','Owned'],['unowned','Not owned']];
 return <fieldset className={controls.ownershipField}><legend>Collection</legend><div className={controls.ownershipChoices} role="group" aria-label="Collection ownership">{choices.map(([id,label])=><button key={id} type="button" aria-pressed={value===id} disabled={id!=='all'&&collection.status!=='ready'} onClick={()=>onChange(id)}>{label}</button>)}</div></fieldset>;
}
export function CollectionNotice({collection,retry}:{collection:CollectionState;retry:()=>void}){
 if(collection.status==='ready')return null;
 return <p className={controls.collectionNotice} role="status">{collection.status==='loading'?'Opening your satchel...':collection.status==='guest'?<Link href="/login">Sign in to see your owned cards.</Link>:<>{collection.error} <button className={controls.button} onClick={retry}>Retry</button></>}</p>;
}
