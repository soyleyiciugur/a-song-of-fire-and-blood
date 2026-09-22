"use client";
import { useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import { NAME_CULTURES } from "@/data/nameGenerator";
import { generateName } from "@/lib/nameGenerator";
import { generateEntityName, type NameEntity } from "@/lib/workbench";
import { CANON_HOUSES } from "@/data/canonHouses";
import { ToolHeading, WorkbenchHeader } from "../WorkbenchShell";
import styles from "../workbench.module.css";

const entities: Array<[NameEntity,string]>=[["personal","Personal"],["house","House"],["place","Place"],["ship","Ship"],["dragon","Dragon"],["inn","Inn / Tavern"],["epithet","Epithet"]];
const regions=["north","riverlands","vale","reach","stormlands","westerlands","crownlands","dorne","ironislands","valyrian"];
const defaultSubtype:Record<NameEntity,string>={personal:"",house:"great",place:"town",ship:"",dragon:"valyrian",inn:"",epithet:"formal"};
const label=(s:string)=>s.replace(/(^|\s)\w/g,m=>m.toUpperCase());

export default function NamesmithPage(){
  const[entity,setEntity]=useState<NameEntity>("personal");
  const[culture,setCulture]=useState("north");
  const[gender,setGender]=useState<"male"|"female">("male");
  const[personalMode,setPersonalMode]=useState<"curated"|"procedural">("curated");
  const[includeByname,setIncludeByname]=useState(true);
  const[tone,setTone]=useState("noble");
  const[subtype,setSubtype]=useState("town");
  const[method,setMethod]=useState<"original"|"canon">("original");
  const[result,setResult]=useState("");
  const[history,setHistory]=useState<string[]>([]);
  const[copied,setCopied]=useState(false);
  const cultureOptions=NAME_CULTURES.map(c=>({value:c.id,label:`${c.name} · ${c.group}`}));
  const regionOptions=regions.map(r=>({value:r,label:label(r)}));
  const forge=()=>{
    let next="";
    if(entity==="personal") next=generateName(personalMode,culture,gender,includeByname,result)?.full??"";
    else if(entity==="house"&&method==="canon"){
      const stature=subtype as "great"|"medium"|"minor";
      const houses=CANON_HOUSES[culture]?.[stature]??[];
      next=houses.length?`House ${houses[Math.floor(Math.random()*houses.length)]}`:"No canon house recorded for this context";
    } else next=generateEntityName(entity,culture,subtype==="mocking"?"mocking":tone,subtype);
    setResult(next); if(next&&!next.startsWith("No canon"))setHistory(h=>[next,...h.filter(x=>x!==next)].slice(0,6)); setCopied(false);
  };
  const isCanon=entity==="house"&&method==="canon"&&result&&!result.startsWith("No canon");
  return <main className={styles.page}><WorkbenchHeader title="The Namesmith">A culture-aware naming toolkit shaped by the peoples and places of ASOFAB.</WorkbenchHeader><article className={`${styles.toolCard} ${styles.singleTool}`}><ToolHeading kind="names" eyebrow="People & tongues" title="The Namesmith"/>
    <div className={styles.entityTabs}>{entities.map(([id,name])=><button key={id} type="button" data-active={entity===id} onClick={()=>{setEntity(id);setSubtype(defaultSubtype[id]);setResult("")}}>{name}</button>)}</div>
    <div className={styles.formGrid}><label><span>{entity==="personal"?"Culture":"Region / culture"}</span><SearchableSelect value={culture} onChange={setCulture} options={entity==="personal"?cultureOptions:regionOptions} searchPlaceholder="Search cultures…"/></label>
      {entity==="personal"&&<><fieldset><legend>Gender</legend><div className={styles.segmented}><button data-active={gender==="male"} onClick={()=>setGender("male")}>Male</button><button data-active={gender==="female"} onClick={()=>setGender("female")}>Female</button></div></fieldset><fieldset><legend>Method</legend><div className={styles.segmented}><button data-active={personalMode==="curated"} onClick={()=>setPersonalMode("curated")}>Lore-shaped</button><button data-active={personalMode==="procedural"} onClick={()=>setPersonalMode("procedural")}>Forge anew</button></div></fieldset><button type="button" className={styles.checkRow} aria-pressed={includeByname} onClick={()=>setIncludeByname(v=>!v)}><span className={styles.checkBox}>{includeByname&&"✓"}</span><span>Allow a byname or trade-name</span></button><p className={styles.helper}>Regional bastard-name traditions vary; use a local byname or surname manually where the story calls for it.</p></>}
      {entity==="house"&&<><fieldset><legend>Source</legend><div className={styles.segmented}><button data-active={method==="original"} onClick={()=>setMethod("original")}>Original</button><button data-active={method==="canon"} onClick={()=>setMethod("canon")}>Canon books</button></div></fieldset><label><span>Stature</span><select value={subtype} onChange={e=>setSubtype(e.target.value)}><option value="great">Great / Major</option><option value="medium">Medium</option><option value="minor">Minor</option></select></label></>}
      {entity==="place"&&<label><span>Place type</span><select value={subtype} onChange={e=>setSubtype(e.target.value)}><option value="town">Town / settlement</option><option value="castle">Castle / holdfast</option><option value="island">Island</option></select></label>}
      {entity==="dragon"&&<label><span>Naming style</span><select value={subtype} onChange={e=>setSubtype(e.target.value)}><option value="valyrian">Valyrian style</option><option value="common">Common / epithet</option></select></label>}
      {entity==="epithet"&&<label><span>Voice</span><select value={subtype} onChange={e=>setSubtype(e.target.value)}><option value="formal">Historical / formal</option><option value="popular">Popular</option><option value="mocking">Mocking</option></select></label>}
      {entity!=="personal"&&<label><span>Tone</span><select value={tone} onChange={e=>setTone(e.target.value)}><option value="noble">Noble</option><option value="grim">Grim</option><option value="rustic">Rustic</option><option value="martial">Martial</option><option value="mysterious">Mysterious</option>{entity==="epithet"&&<option value="mocking">Mocking</option>}</select></label>}
    </div><button type="button" className={styles.primary} onClick={forge}>Forge {entity==="epithet"?"an":"a"} {entity}</button>
    {result&&<div className={styles.nameResult}><div><small>{isCanon?"Canon-book suggestion":"Original result"}</small><strong>{result}</strong>{entity==="house"&&<span className={isCanon?styles.canonTag:styles.originalTag}>{isCanon?"Canon":"Generated · not canon"}</span>}</div><button onClick={async()=>{await navigator.clipboard.writeText(result);setCopied(true)}}>{copied?"Copied":"Copy"}</button></div>}
    {history.length>1&&<div className={styles.history}><small>Recent names</small><div>{history.slice(1).map(x=><button key={x} onClick={()=>setResult(x)}>{x}</button>)}</div></div>}
  </article></main>;
}
