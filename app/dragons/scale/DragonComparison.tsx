"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { dragonSizes, type SizeDragon } from "@/data/dragon-sizes";
import shapes from "@/data/dragon-size-shapes.json";
import styles from "./scale.module.css";

const filters = ["All", "HotD", "GoT", "Book", "Unknown shape"] as const;
const initial = ["balerion", "vhagar", "caraxes", "drogon"];
const measure = (d: SizeDragon) => `${d.minimum ? "≥" : "≈"} ${d.length} m`;
function Shape({ dragon, width }: { dragon: SizeDragon; width: number }) {
  const clipId = useId().replace(/:/g, "");
  const shape = shapes[dragon.id];
  return <svg role="img" aria-label={`${dragon.name}, ${measure(dragon)} long`} width={width} height={width * shape.box[3] / shape.box[2]} viewBox={shape.box.join(" ")}>
    <defs><clipPath id={clipId}><path d={shape.clip} /></clipPath></defs>
    <image href={`/images/dragons/sizes/atlas/${shape.file}.png`} width={shape.imageWidth} height={shape.imageHeight} clipPath={`url(#${clipId})`} />
  </svg>;
}
export default function DragonComparison() {
  const [selected, setSelected] = useState<string[]>(initial);
  const [preview, setPreview] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(1000);
  const [mode, setMode] = useState<"overlay" | "rows">("overlay");
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const ppm = Math.max(3, (width - 96) / 120) * zoom;
  const stageWidth = 120 * ppm + 96;
  const active = dragonSizes.filter(d => selected.includes(d.id) || preview === d.id);
  const filtered = dragonSizes.filter(d => (filter === "All" || (filter === "Unknown shape" ? d.uncertain : d.source === filter)) && d.name.toLowerCase().includes(query.toLowerCase()));
  const current = dragonSizes.find(d => d.id === preview);
  const height = Math.max(220, ...active.map(d => d.length * ppm * shapes[d.id].box[3] / shapes[d.id].box[2] + 70));
  function toggle(id: string) { setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }
  function reset() { setSelected(initial); setPreview(null); setZoom(1); setQuery(""); setFilter("All"); setMode("overlay"); viewport.current?.scrollTo({ left: 0 }); }
  return <main className={styles.page}><div className={styles.container}>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/bestiary">The Bestiary</Link><span>/</span><span>The Measure of Fire</span></nav>
    <header className={styles.hero}><div><p className={styles.eyebrow}>A comparative study · Dragons of Westeros</p><h1>The Measure of Fire</h1><p className={styles.lead}>From the last flicker to the Black Dread. Place the dragons on a shared scale and see how far their shadows reach.</p></div><div className={styles.seal}><strong>28</strong><span>dragons & records</span></div></header>
    <nav className="realm-section-tabs" aria-label="Bestiary sections"><Link href="/bestiary/dragons">Dragons</Link><Link href="/dragons/scale" aria-current="page">The Measure of Fire</Link><Link href="/bestiary/direwolves">Direwolves</Link><Link href="/bestiary/dogs">Dogs</Link><Link href="/bestiary/cats">Cats</Link></nav>
    <section className={styles.comparison} aria-label="Dragon size comparison">
      <div className={styles.toolbar}><div className={styles.mode}><button aria-pressed={mode === "overlay"} onClick={() => setMode("overlay")}>Overlay</button><button aria-pressed={mode === "rows"} onClick={() => setMode("rows")}>Separate rows</button></div><label className={styles.zoom}>Zoom <input aria-label="Stage zoom" type="range" min="1" max="3" step="0.1" value={zoom} onChange={e => setZoom(Number(e.target.value))} /><span>{Math.round(zoom * 100)}%</span></label><button onClick={reset}>Reset</button></div>
      <div className={styles.stageHeading}><span>Length from snout to tail</span><span>One shared scale · metres</span></div>
      <div ref={viewport} className={styles.viewport} tabIndex={0} role="region" aria-label="Dragon silhouettes; scroll horizontally to explore">
        <div className={styles.canvas} style={{ width: stageWidth, minHeight: height + 48 }}>
          <div className={styles.gridLines} aria-hidden="true">{Array.from({ length: 13 }, (_, i) => <i key={i} style={{ left: 48 + i * 10 * ppm }} />)}</div>
          {mode === "overlay" ? <div className={styles.overlay} style={{ height }}>
            {active.map((d, i) => <div key={d.id} className={styles.silhouette} style={{ left: 48, bottom: 0, zIndex: preview === d.id ? 40 : i + 1, opacity: preview && preview !== d.id ? 0.32 : selected.includes(d.id) ? 1 : 0.65 }}><Shape dragon={d} width={d.length * ppm} /></div>)}
            <svg className={styles.human} aria-label="Human reference, 1.75 metres tall" role="img" style={{ left: 25 }} width={0.6 * ppm} height={1.75 * ppm} viewBox="0 0 60 175"><circle cx="30" cy="15" r="14"/><path d="M17 33H43L58 98H47L37 61V108L44 175H31L28 115L24 175H11L17 108V61L10 98H0Z"/></svg>
          </div> : <div className={styles.rows}>{active.map(d => <div className={styles.row} key={d.id}><div className={styles.rowLabel}>{d.name}<span>{measure(d)}</span></div><div style={{ marginLeft: 48 }}><Shape dragon={d} width={d.length * ppm} /></div></div>)}</div>}
          {!active.length && <p className={styles.empty}>Choose a dragon below to cast its shadow.</p>}
          <div className={styles.ruler} aria-hidden="true">{Array.from({ length: 13 }, (_, i) => <span key={i} style={{ left: 48 + i * 10 * ppm }}>{i * 10}<small> m</small></span>)}</div>
        </div>
      </div>
      <div className={styles.stageFooter}><span>{selected.length} selected · {mode === "overlay" ? "Largest behind, smallest in front" : "Aligned at the snout"}</span><span>Human reference: 1.75 m · Scroll to explore</span></div>
    </section>
    <div className={styles.selection} aria-label="Selected dragons">{dragonSizes.filter(d => selected.includes(d.id)).map(d => <button key={d.id} onClick={() => toggle(d.id)} aria-label={`Remove ${d.name}`}><i style={{ background: d.color }} />{d.name}<span aria-hidden="true">×</span></button>)}{selected.length > 0 && <button className={styles.clear} onClick={() => { setSelected([]); setPreview(null); }}>Clear selection</button>}</div>
    <section className={styles.catalog} aria-labelledby="choose-dragons"><div className={styles.catalogHeader}><div><p className={styles.eyebrow}>Build your comparison</p><h2 id="choose-dragons">Choose your dragons</h2></div><p>Hover or focus to preview. Select to keep on the stage.</p></div>
      <div className={styles.catalogControls}><div className={styles.filters} role="group" aria-label="Filter dragon records">{filters.map(f => <button key={f} aria-pressed={filter === f} onClick={() => { setFilter(f); setPreview(null); }}>{f}</button>)}</div><input className={styles.search} type="search" aria-label="Search dragons" placeholder="Find a dragon…" value={query} onChange={e => setQuery(e.target.value)} /></div>
      <div className={styles.cards}>{filtered.map(d => <button key={d.id} className={styles.card} aria-pressed={selected.includes(d.id)} onClick={() => toggle(d.id)} onMouseEnter={() => setPreview(d.id)} onMouseLeave={() => setPreview(null)} onFocus={() => setPreview(d.id)} onBlur={() => setPreview(null)}><span className={styles.check} aria-hidden="true">{selected.includes(d.id) ? "✓" : "+"}</span><i className={styles.swatch} style={{ background: d.color }} /><span className={styles.cardName}>{d.name}<small>{d.source}{d.uncertain ? " · Shape uncertain" : ""}</small></span><span className={styles.length}>{measure(d)}</span></button>)}</div>
      {!filtered.length && <p className={styles.noResults}>No dragons match this search.</p>}
      <div className={styles.detail} aria-live="polite">{current ? <><strong>{current.name}</strong><span>Length {measure(current)}</span><span>Wingspan ≈ {current.wingspan} m</span><span>{current.source} reference{current.uncertain ? " · Unconfirmed silhouette" : ""}</span></> : <span>Every silhouette keeps its original proportions. All dragons begin at the same point on the ruler.</span>}</div>
    </section>
    <footer className={styles.notes}><p><strong>A note on the scale</strong> Measurements are estimates from the supplied illustration, not official dimensions. Screen versions are used where supplied; the remaining records use book references. ≥ marks a lower-bound estimate. Wing shapes are folded: their height on the stage does not represent wingspan.</p><p>Illustration credited to <strong>fanglycan.commissions.open</strong> in the <a href="https://www.reddit.com/r/HouseOfTheDragon/comments/1q4sd0a/this_is_probably_the_best_illustration_of_dragon/" target="_blank" rel="noreferrer">original comparison</a>. Morghul & Shrykos share one supplied silhouette record.</p></footer>
  </div></main>;
}
