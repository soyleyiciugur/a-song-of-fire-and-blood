"use client";
import CardsSelect from './CardsSelect';
import {availableMetadata,metadataLabels,type MetadataItem,type MetadataSelection} from '@/lib/the-great-game/card-metadata';
import controls from './CardsControls.module.css';
export default function MetadataFilters({items,value,onChange}:{items:readonly MetadataItem[];value:MetadataSelection;onChange:(value:MetadataSelection)=>void}) {
 return <>{availableMetadata(items).map(group=><label className={controls.field} key={group.id}><CardsSelect ariaLabel={group.label} value={value[group.id]??''} onChange={next=>onChange({...value,[group.id]:next})} options={[{value:'',label:'All '+group.label},...group.options.map(option=>({value:option.id,label:option.label}))]}/></label>)}</>;
}
export function MetadataBadges({item}:{item:MetadataItem}) {const labels=metadataLabels(item);return labels.length?<small className={controls.metadataBadges}>{labels.map(label=><span key={label}>{label}</span>)}</small>:null;}
