"use client";
import {MATCH_TYPES,type MatchType} from '@/lib/the-great-game/match-types';
import styles from './MatchTypePicker.module.css';
export default function MatchTypePicker({value,onChange,disabled=false}:{value:MatchType;onChange:(value:MatchType)=>void;disabled?:boolean}) {
 return <fieldset className={styles.picker} disabled={disabled}><legend>Match type</legend>{MATCH_TYPES.map(option=><label key={option.value} data-selected={value===option.value}><input className={styles.nativeRadio} type="radio" name="match-type" value={option.value} checked={value===option.value} onChange={()=>onChange(option.value)}/><i className={styles.seal} aria-hidden="true"/><span><strong>{option.label}</strong><small>{option.title}</small><span>{option.description}</span></span></label>)}</fieldset>;
}
