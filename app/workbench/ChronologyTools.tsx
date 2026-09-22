"use client";
import { useMemo, useState, type ReactNode } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import charactersData from "@/data/characters/characters.json";
import type { Character } from "@/types/character";
import { findKinship, formatWorldDate, fromWorldDay, toWorldDay, type WorldDate } from "@/lib/workbench";
import { ToolHeading } from "./WorkbenchShell";
import styles from "./workbench.module.css";

type Numeric = number | "";
type EditableDate = { day: Numeric; moon: Numeric; year: Numeric };
const characters=charactersData as Character[];
const nameCounts=characters.reduce((counts,character)=>counts.set(character.name,(counts.get(character.name)??0)+1),new Map<string,number>());
const characterOptions=characters.filter(c=>!c.hidden).sort((a,b)=>a.name.localeCompare(b.name)).map(c=>({value:c.id,label:nameCounts.get(c.name)!>1?`${c.name} — ${c.title||c.house} (${c.id})`:c.name}));
const optionalCharacterOptions=[{value:"",label:"None — use constraints"},...characterOptions];
const numberValue=(value:Numeric)=>value===""?0:value;
const worldDate=(value:EditableDate):WorldDate=>({day:numberValue(value.day),moon:numberValue(value.moon),year:numberValue(value.year)});
const inputNumber=(value:string):Numeric=>value===""?"":Number(value);

function DateFields({value,onChange}:{value:EditableDate;onChange:(v:EditableDate)=>void}){
  const era=numberValue(value.year)<0?"BC":"AC";
  return <div className={styles.dateFields}>
    <label><span>Day</span><input inputMode="numeric" type="number" min="1" max="30" value={value.day} onChange={e=>onChange({...value,day:inputNumber(e.target.value)})}/></label>
    <label><span>Moon</span><input inputMode="numeric" type="number" min="1" max="12" value={value.moon} onChange={e=>onChange({...value,moon:inputNumber(e.target.value)})}/></label>
    <label><span>Year</span><input inputMode="numeric" type="number" min="0" value={value.year===""?"":Math.abs(value.year)} onChange={e=>{const next=inputNumber(e.target.value);onChange({...value,year:next===""?"":era==="BC"?-next:next})}}/></label>
    <label><span>Era</span><select value={era} onChange={e=>onChange({...value,year:(e.target.value==="BC"?-1:1)*Math.abs(numberValue(value.year))})}><option>AC</option><option>BC</option></select></label>
  </div>;
}

export function KinshipTool(){
  const[a,setA]=useState(""); const[b,setB]=useState("");
  const result=useMemo(()=>a&&b?findKinship(characters,a,b):null,[a,b]);
  return <article className={`${styles.toolCard} ${styles.singleTool}`}><ToolHeading kind="kinship" eyebrow="Family records" title="Kinship Finder"/><p className={styles.toolIntro}>Uses the existing character parent, sibling, and spouse records; no duplicate family tree is maintained.</p><div className={styles.selectGrid}><label><span>First character</span><SearchableSelect value={a} onChange={setA} options={characterOptions} searchPlaceholder="Search characters…"/></label><label><span>Second character</span><SearchableSelect value={b} onChange={setB} options={characterOptions} searchPlaceholder="Search characters…"/></label></div>{a&&b&&<div className={styles.resultPanel}>{result?<><small>Closest recorded kinship</small><strong>{result.label}</strong><div className={styles.path}>{result.path.map((p,i)=><span key={`${p.id}-${i}`}>{i>0&&<i>→</i>}<a href={`/characters/${p.id}`}>{p.name}</a></span>)}</div></>:<p>No family path is recorded between these characters.</p>}</div>}</article>;
}

export function AgeTool(){
  const[id,setId]=useState(""); const[date,setDate]=useState<EditableDate>({day:1,moon:1,year:60}); const[mode,setMode]=useState<"at"|"reverse">("at"); const[targetAge,setTargetAge]=useState<Numeric>(18);
  const c=characters.find(x=>x.id===id); const born=c?.nameday; let result:ReactNode="";
  if(born){if(mode==="at"){const diff=toWorldDay(worldDate(date))-toWorldDay(born);result=diff<0?"This date is before the recorded nameday.":`${Math.floor(diff/360)} years, ${Math.floor((diff%360)/30)} moons, ${diff%30} days old`;}else{const start=fromWorldDay(toWorldDay(born)+numberValue(targetAge)*360);const end=fromWorldDay(toWorldDay(start)+359);result=<span className={styles.dateRange}><span><b>FROM:</b> {formatWorldDate(start)}</span><span><b>TO:</b> {formatWorldDate(end)}</span></span>}}
  return <article className={`${styles.toolCard} ${styles.singleTool}`}><ToolHeading kind="age" eyebrow="Character chronology" title="Age at Date"/><div className={styles.entityTabs}><button data-active={mode==="at"} onClick={()=>setMode("at")}>Age on date</button><button data-active={mode==="reverse"} onClick={()=>setMode("reverse")}>Dates for age</button></div><div className={styles.formGrid}><label><span>Character</span><SearchableSelect value={id} onChange={setId} options={characterOptions} searchPlaceholder="Search characters…"/></label>{mode==="reverse"?<label><span>Age</span><input type="number" min="0" value={targetAge} onChange={e=>setTargetAge(inputNumber(e.target.value))}/></label>:<DateFields value={date} onChange={setDate}/>}</div>{id&&!born&&<p className={styles.hint}>This character has no exact nameday in the current records.</p>}{result&&<div className={styles.resultPanel}><small>{mode==="at"?formatWorldDate(worldDate(date)):`The year they are ${numberValue(targetAge)}`}</small><strong>{result}</strong></div>}</article>;
}

export function DateReckonerTool(){
  const[mode,setMode]=useState<"between"|"shift">("between"); const[a,setA]=useState<EditableDate>({day:1,moon:1,year:60}); const[b,setB]=useState<EditableDate>({day:1,moon:2,year:60}); const[years,setYears]=useState<Numeric>(0); const[moons,setMoons]=useState<Numeric>(0); const[days,setDays]=useState<Numeric>(0); const[direction,setDirection]=useState(1);
  const delta=Math.abs(toWorldDay(worldDate(b))-toWorldDay(worldDate(a))); const shifted=fromWorldDay(toWorldDay(worldDate(a))+direction*(numberValue(years)*360+numberValue(moons)*30+numberValue(days)));
  return <article className={`${styles.toolCard} ${styles.singleTool}`}><ToolHeading kind="reckoner" eyebrow="World calendar" title="Date Reckoner"/><div className={styles.entityTabs}><button data-active={mode==="between"} onClick={()=>setMode("between")}>Between dates</button><button data-active={mode==="shift"} onClick={()=>setMode("shift")}>Add / subtract</button></div><DateFields value={a} onChange={setA}/>{mode==="between"?<><p className={styles.fieldDivider}>Second date</p><DateFields value={b} onChange={setB}/><div className={styles.resultPanel}><small>Elapsed time</small><strong>{Math.floor(delta/360)} years, {Math.floor(delta%360/30)} moons, {delta%30} days</strong><span>{delta} days in all</span></div></>:<><div className={styles.shiftGrid}><label><span>Years</span><input type="number" min="0" value={years} onChange={e=>setYears(inputNumber(e.target.value))}/></label><label><span>Moons</span><input type="number" min="0" value={moons} onChange={e=>setMoons(inputNumber(e.target.value))}/></label><label><span>Days</span><input type="number" min="0" value={days} onChange={e=>setDays(inputNumber(e.target.value))}/></label></div><div className={styles.segmented}><button data-active={direction===1} onClick={()=>setDirection(1)}>Add</button><button data-active={direction===-1} onClick={()=>setDirection(-1)}>Subtract</button></div><div className={styles.resultPanel}><small>Reckoned date</small><strong>{formatWorldDate(shifted)}</strong></div></>}</article>;
}

export function NamedayTool(){
  const[id,setId]=useState(""); const[age,setAge]=useState<Numeric>(18); const[year,setYear]=useState<Numeric>(60); const[result,setResult]=useState<WorldDate|null>(null); const c=characters.find(x=>x.id===id);
  const generate=()=>{const birthYear=c?.nameday?.year??numberValue(year)-numberValue(age);setResult({day:1+Math.floor(Math.random()*30),moon:1+Math.floor(Math.random()*12),year:birthYear})};
  return <article className={`${styles.toolCard} ${styles.singleTool}`}><ToolHeading kind="nameday" eyebrow="Character chronology" title="Nameday Randomizer"/><p className={styles.toolIntro}>Choose a known character, or constrain a new nameday with age and story year.</p><div className={styles.formGrid}><label><span>Known character (optional)</span><SearchableSelect value={id} onChange={setId} options={optionalCharacterOptions} placeholder="None — use constraints" searchPlaceholder="Search characters…"/></label>{!c?.nameday&&<><label><span>Approximate age</span><input type="number" min="0" value={age} onChange={e=>setAge(inputNumber(e.target.value))}/></label><label><span>At year AC</span><input type="number" min="0" value={year} onChange={e=>setYear(inputNumber(e.target.value))}/></label></>}</div>{c?.nameday&&<p className={styles.helper}>{c.name} already has a recorded nameday; the generator keeps its known year as the constraint.</p>}<button className={styles.primary} onClick={generate}>Roll a nameday</button>{result&&<div className={styles.nameResult}><div><small>Generated date</small><strong>{formatWorldDate(result)}</strong></div><button onClick={()=>void navigator.clipboard.writeText(formatWorldDate(result))}>Copy</button></div>}</article>;
}
