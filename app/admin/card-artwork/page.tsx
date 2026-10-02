"use client";

import { useEffect, useRef, useState } from "react";
import { getAllGameCards } from "@/lib/the-great-game/cards";
import { ArtworkMapSchema, DEFAULT_ARTWORK, type ArtworkSettings } from "@/lib/the-great-game/artwork";
import { CardArtwork, CardArtworkSettingsContext } from "@/components/cards/CardArtwork";
import { GameCardFace } from "@/components/cards/GameCardFace";
import savedSettings from "@/data/the-great-game/artwork.json";
import styles from "./artwork.module.css";

const cards = getAllGameCards().slice().sort((a,b) => a.cost-b.cost || a.name.localeCompare(b.name, "en"));
const DRAFT_KEY = "admin:card-artwork:draft";

export default function CardArtworkEditor() {
  const [settings, setSettings] = useState<Record<string, ArtworkSettings>>(savedSettings);
  const [id, setId] = useState(cards[0].id);
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const drag = useRef<{ x: number; y: number; framing: ArtworkSettings } | null>(null);
  const card = cards.find(card => card.id === id)!;
  const framing = settings[id] ?? DEFAULT_ARTWORK;
  useEffect(() => {
    try {
      const parsed = ArtworkMapSchema.safeParse(JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null"));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore the browser draft after hydration without changing server markup.
      if (parsed.success) setSettings(parsed.data);
    } catch { /* Use the published framing when a draft cannot be read. */ }
    setLoaded(true);
  }, []);
  function update(next: ArtworkSettings) {
    const draft = { ...settings, [id]: next };
    setSettings(draft);
    setStatus("");
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); }
    catch { setStatus("Local draft could not be saved. Publish to keep this framing."); }
  }
  async function publish() {
    setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/admin/card-artwork", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Publish failed");
      localStorage.removeItem(DRAFT_KEY);
      setStatus("Published. The site will use this framing after deployment.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Publish failed"); }
    finally { setBusy(false); }
  }
  return <main className={styles.page}>
    <header><h1>Card Artwork</h1><button onClick={publish} disabled={busy || !loaded}>{busy ? "Publishing..." : "Publish Framing"}</button></header>
    <div className={styles.workspace}>
      <aside><input aria-label="Find card" placeholder="Find card" value={query} onChange={e=>setQuery(e.target.value)} />
        <div className={styles.list}>{cards.filter(card => card.name.toLowerCase().includes(query.toLowerCase())).map(card => <button key={card.id} aria-pressed={id===card.id} onClick={()=>setId(card.id)}>{card.name}<small>{card.cost}</small></button>)}</div>
      </aside>
      <CardArtworkSettingsContext.Provider value={settings}>
        <section><h2>{card.name}</h2>
          <div className={styles.previews}>
            <div><h3>Framing</h3><div className={styles.crop} onPointerDown={event=>{
              if (busy || event.button !== 0) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current={x:event.clientX,y:event.clientY,framing:{...framing}};
            }} onPointerMove={event=>{
              if (!drag.current) return;
              const rect=event.currentTarget.getBoundingClientRect();
              update({...drag.current.framing,x:Math.max(0,Math.min(100,drag.current.framing.x-(event.clientX-drag.current.x)/rect.width*100)),y:Math.max(0,Math.min(100,drag.current.framing.y-(event.clientY-drag.current.y)/rect.height*100))});
            }} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}><CardArtwork card={card} className={styles.image} /></div></div>
            <div><h3>Live Preview</h3><GameCardFace card={card} onSelect={()=>{}} /></div>
          </div>
          <fieldset disabled={busy} className={styles.controls}>
            {([['x','Horizontal',0,100,1],['y','Vertical',0,100,1],['zoom','Zoom',1,3,.01]] as const).map(([key,label,min,max,step])=><label key={key}><span>{label}</span><input aria-label={label} type="range" min={min} max={max} step={step} value={framing[key]} onChange={e=>update({...framing,[key]:Number(e.target.value)})}/><output>{key==='zoom'?`${framing[key].toFixed(2)}x`:`${Math.round(framing[key])}%`}</output></label>)}
            <button type="button" onClick={()=>update({...DEFAULT_ARTWORK})}>Reset Framing</button>
          </fieldset>
          <p role="status">{status}</p>
        </section>
      </CardArtworkSettingsContext.Provider>
    </div>
  </main>;
}
