"use client";
import { useState } from "react";
import Link from "next/link";
import pageStyles from "./updateNotes.module.css";
import notes from "@/data/update-notes.json";
import styles from "@/components/updatesFeed.module.css";
type Day = { date: string; items: string[]; features?: string[]; links?: Record<string,string> };
export default function UpdateNotesContent() {
  const [tab,setTab] = useState<"features"|"fixes">("features");
  return <><div className={pageStyles.tabs} role="tablist" aria-label="Update notes">{(["features","fixes"] as const).map(t=><button key={t} role="tab" aria-selected={tab===t} aria-controls="update-panel" onClick={()=>setTab(t)}>{t==="features"?"Features":"Fixes"}</button>)}</div><div id="update-panel" role="tabpanel">{(notes as Day[]).map(day=>{
    const items=tab==="features"?day.features??[]:day.items.filter(item=>!day.features?.includes(item));
    return items.length?<section className={styles.group} key={day.date}><h2 className={styles.heading}><time dateTime={day.date}>{day.date}</time></h2><ul className={styles.list}>{items.map(item=><li className={styles.entry} key={item}><span>{item}</span>{day.links?.[item]&&<Link className={pageStyles.goLink} href={day.links[item]}><span>Open record</span><span aria-hidden="true">&#8594;</span></Link>}</li>)}</ul></section>:null;
  })}</div></>;
}
