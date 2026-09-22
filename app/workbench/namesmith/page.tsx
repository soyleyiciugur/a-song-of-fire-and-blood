"use client";
import { useState } from "react";
import SearchableSelect, { type SearchableSelectOption } from "@/components/SearchableSelect";
import { NAME_CULTURES } from "@/data/nameGenerator";
import { generateName } from "@/lib/nameGenerator";
import { BASTARD_TRADITIONS, generateContextName, NAMING_REGIONS, TONE_OPTIONS, type NamesmithEntity } from "@/lib/namesmith";
import { CANON_HOUSES } from "@/data/canonHouses";
import { ToolHeading, WorkbenchHeader } from "../WorkbenchShell";
import styles from "../workbench.module.css";

type Entity="personal"|NamesmithEntity;
const entities:Array<[Entity,string]>=[["personal","Personal"],["house","House"],["place","Place"],["ship","Ship"],["dragon","Dragon"],["inn","Inn / Tavern"],["epithet","Epithet"]];
const defaults:Record<Entity,string>={personal:"",house:"great",place:"town",ship:"warship",dragon:"valyrian",inn:"respectable",epithet:"formal"};
const subtypeOptions:Partial<Record<Entity,SearchableSelectOption[]>>={
  house:[{value:"great",label:"Great / major"},{value:"medium",label:"Medium"},{value:"minor",label:"Minor / landed"}],
  place:[{value:"town",label:"Town / settlement"},{value:"castle",label:"Castle / holdfast"},{value:"village",label:"Village"},{value:"natural",label:"Natural landmark"},{value:"island",label:"Island"}],
  ship:[{value:"warship",label:"Warship"},{value:"merchant",label:"Merchant vessel"},{value:"explorer",label:"Explorer / adventurer"}],
  dragon:[{value:"valyrian",label:"Valyrian-style name"},{value:"common",label:"Common / epithet-style"}],
  inn:[{value:"respectable",label:"Respectable inn"},{value:"rough",label:"Rough tavern"},{value:"coaching",label:"Roadside / coaching inn"}],
  epithet:[{value:"formal",label:"Historical / formal"},{value:"popular",label:"Popular"},{value:"mocking",label:"Mocking"}],
};
const fieldLabels:Partial<Record<Entity,string>>={house:"Stature",place:"Place type",ship:"Vessel",dragon:"Naming style",inn:"Establishment",epithet:"Voice"};
const personalOptions=NAME_CULTURES.map(c=>({value:c.id,label:`${c.name} · ${c.group}`}));
const allRegionOptions=Object.entries(NAMING_REGIONS).map(([value,p])=>({value,label:`${p.label} · ${p.group}`}));
const houseRegionOptions=allRegionOptions.filter(option=>option.value in CANON_HOUSES);

function SelectField({label,value,onChange,options}:{label:string;value:string;onChange:(value:string)=>void;options:SearchableSelectOption[]}){
  return <label><span>{label}</span><SearchableSelect value={value} onChange={onChange} options={options} searchPlaceholder={`Search ${label.toLowerCase()}…`}/></label>;
}

export default function NamesmithPage(){
  const[entity,setEntity]=useState<Entity>("personal"); const[personalCulture,setPersonalCulture]=useState("north"); const[region,setRegion]=useState("north");
  const[gender,setGender]=useState<"male"|"female">("male"); const[personalMode,setPersonalMode]=useState<"curated"|"procedural">("curated"); const[includeByname,setIncludeByname]=useState(true);
  const[tone,setTone]=useState("noble"); const[subtype,setSubtype]=useState("great"); const[method,setMethod]=useState<"original"|"canon">("original");
  const[result,setResult]=useState(""); const[history,setHistory]=useState<string[]>([]); const[copied,setCopied]=useState(false);
  const tradition=BASTARD_TRADITIONS[personalCulture];
  const personalCultureLabel=NAME_CULTURES.find(culture=>culture.id===personalCulture)?.name??"this culture";
  const forge=()=>{
    let next="";
    if(entity==="personal")next=generateName(personalMode,personalCulture,gender,includeByname,result)?.full??"";
    else if(entity==="house"&&method==="canon"){
      const houses=CANON_HOUSES[region]?.[subtype as "great"|"medium"|"minor"]??[];
      next=houses.length?`House ${houses[Math.floor(Math.random()*houses.length)]}`:"No canon house recorded for this context";
    }else next=generateContextName(entity,region,tone,subtype);
    setResult(next);if(next&&!next.startsWith("No canon"))setHistory(current=>[next,...current.filter(item=>item!==next)].slice(0,7));setCopied(false);
  };
  const isCanon=entity==="house"&&method==="canon"&&result&&!result.startsWith("No canon");
  const actionLabel=entity==="personal"?"Forge a personal name":entity==="house"&&method==="canon"?"Suggest a canon house":entity==="epithet"?"Forge an epithet":entity==="inn"?"Forge an inn name":`Forge a ${entity} name`;
  return <main className={styles.page}><WorkbenchHeader title="The Namesmith">A culture-aware naming toolkit shaped by the peoples and places of ASOFAB.</WorkbenchHeader><article className={`${styles.toolCard} ${styles.singleTool} ${styles.namesmithCard}`}><ToolHeading kind="names" eyebrow="People & tongues" title="The Namesmith"/>
    <div className={styles.entityTabs}>{entities.map(([id,name])=><button key={id} type="button" data-active={entity===id} onClick={()=>{setEntity(id);setSubtype(defaults[id]);setResult("")}}>{name}</button>)}</div>
    <div className={styles.formGrid}>
      {entity==="personal"?<SelectField label="Culture" value={personalCulture} onChange={setPersonalCulture} options={personalOptions}/>:<SelectField label="Region / culture" value={region} onChange={setRegion} options={entity==="house"?houseRegionOptions:allRegionOptions}/>}
      {entity==="personal"&&<><fieldset><legend>Gender</legend><div className={styles.segmented}><button type="button" data-active={gender==="male"} onClick={()=>setGender("male")}>Male</button><button type="button" data-active={gender==="female"} onClick={()=>setGender("female")}>Female</button></div></fieldset><fieldset><legend>Method</legend><div className={styles.segmented}><button type="button" data-active={personalMode==="curated"} onClick={()=>setPersonalMode("curated")}>Lore-shaped</button><button type="button" data-active={personalMode==="procedural"} onClick={()=>setPersonalMode("procedural")}>Forge anew</button></div></fieldset><button type="button" className={styles.checkRow} aria-pressed={includeByname} onClick={()=>setIncludeByname(value=>!value)}><span className={styles.checkBox}>{includeByname&&"✓"}</span><span>Allow a byname or trade-name</span></button><div className={styles.bastardHelper}><button type="button" className={styles.helpTrigger} aria-describedby="bastard-help">?</button><span id="bastard-help" role="tooltip">{tradition?`In book tradition, acknowledged bastards from ${personalCultureLabel} may use “${tradition}”. It is never applied automatically.`:"This culture has no single regional bastard surname. Choose any story-appropriate name manually."}</span><p>Bastard-name tradition</p></div></>}
      {entity==="house"&&<fieldset><legend>Source</legend><div className={styles.segmented}><button type="button" data-active={method==="original"} onClick={()=>setMethod("original")}>Original</button><button type="button" data-active={method==="canon"} onClick={()=>setMethod("canon")}>Canon books</button></div></fieldset>}
      {entity!=="personal"&&subtypeOptions[entity]&&<SelectField label={fieldLabels[entity]??"Type"} value={subtype} onChange={setSubtype} options={subtypeOptions[entity]!}/>}
      {entity!=="personal"&&!(entity==="house"&&method==="canon")&&<SelectField label="Tone" value={tone} onChange={setTone} options={entity==="epithet"?[...TONE_OPTIONS,{value:"mocking",label:"Mocking / unkind"}]:TONE_OPTIONS}/>}
    </div>
    <button type="button" className={styles.primary} onClick={forge}>{actionLabel}</button>
    {result&&<div className={styles.nameResult}><div><small>{isCanon?"Canon-book suggestion":"Original result"}</small><strong>{result}</strong><span>{isCanon?`${NAMING_REGIONS[region]?.label} · ${subtype} house`:`${entity==="personal"?NAME_CULTURES.find(c=>c.id===personalCulture)?.name:NAMING_REGIONS[region]?.label} · ${entity}`}</span>{entity==="house"&&<span className={isCanon?styles.canonTag:styles.originalTag}>{isCanon?"Canon":"Generated · not canon"}</span>}</div><button type="button" onClick={async()=>{await navigator.clipboard.writeText(result);setCopied(true)}}>{copied?"Copied":"Copy"}</button></div>}
    {history.length>1&&<div className={styles.history}><small>Recent names</small><div>{history.slice(1).map(item=><button type="button" key={item} onClick={()=>setResult(item)}>{item}</button>)}</div></div>}
  </article></main>;
}
