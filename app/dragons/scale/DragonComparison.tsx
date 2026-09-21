"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import DragonSectionHeader from "@/components/DragonSectionHeader";
import {
  dragonSizeComparison,
  type DragonSizeMode,
  type DragonSizeRecord,
} from "@/data/dragon-size-comparison";
import styles from "./scale.module.css";

const { stage, human, filters, defaultSelected, dragons } = dragonSizeComparison;
const measure = (dragon: DragonSizeRecord) => `${dragon.minimum ? "≥" : "≈"} ${dragon.length} m`;

function Shape({ dragon, width }: { dragon: DragonSizeRecord; width: number }) {
  const height = width * dragon.intrinsicHeight / dragon.intrinsicWidth;
  return <Image unoptimized src={dragon.asset} alt={`${dragon.name}, ${measure(dragon)} long`} width={width} height={height} style={{ width, height }} draggable={false} />;
}

export default function DragonComparison({ initialSelected }: { initialSelected?: string[] }) {
  const initial = initialSelected ?? defaultSelected;
  const [selected, setSelected] = useState<string[]>([...initial]);
  const [preview, setPreview] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(stage.defaultZoom);
  const [width, setWidth] = useState(1000);
  const [viewportHeight, setViewportHeight] = useState(600);
  const [mode, setMode] = useState<DragonSizeMode>(stage.defaultMode as DragonSizeMode);
  const viewport = useRef<HTMLDivElement>(null);
  const pointerPosition = useRef<{ x: number; y: number } | null>(null);
  const previewFrame = useRef<number | null>(null);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => { setWidth(entry.contentRect.width); setViewportHeight(entry.contentRect.height); });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => () => {
    if (previewFrame.current !== null) cancelAnimationFrame(previewFrame.current);
  }, []);
  const horizontalPadding = stage.originX + stage.endPadding;
  const ppm = Math.max(0.1, (width - horizontalPadding) / stage.axisMaxMetres) * zoom;
  const stageWidth = Math.max(width, stage.axisMaxMetres * ppm + horizontalPadding);
  const active = dragons.filter(d => selected.includes(d.id) || preview === d.id);
  const filtered = dragons.filter(d => (filter === "All" || (filter === "Unknown shape" ? d.uncertain : d.source === filter)) && d.name.toLowerCase().includes(query.toLowerCase()));
  const current = dragons.find(d => d.id === preview);
  const height = Math.max(
    viewportHeight - stage.contentBottomSpace + 2,
    stage.minimumHeight,
    ...dragons.map(d => d.length * ppm * d.intrinsicHeight / d.intrinsicWidth + stage.contentBottomSpace),
  );
  // Hover never changes the canvas extent; zoom changes only its contents.
  useEffect(() => {
    const element = viewport.current;
    if (element && mode === "overlay") element.scrollTop = element.scrollHeight - element.clientHeight;
  }, [zoom, width, viewportHeight, mode]);
  function toggle(id: string) { setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }
  function reset() { setSelected([...initial]); setPreview(null); setZoom(stage.defaultZoom); setQuery(""); setFilter("All"); setFiltersOpen(false); setMode(stage.defaultMode as DragonSizeMode); viewport.current?.scrollTo({ left: 0, top: viewport.current.scrollHeight }); document.querySelector(`[data-dragon-picker]`)?.scrollTo({ top: 0 }); }
  function previewAtPointer() {
    const point = pointerPosition.current;
    if (!point) return;
    const card = document.elementFromPoint(point.x, point.y)?.closest<HTMLElement>("[data-dragon-id]");
    setPreview(card?.dataset.dragonId ?? null);
  }
  function schedulePreviewAtPointer() {
    if (previewFrame.current !== null) cancelAnimationFrame(previewFrame.current);
    previewFrame.current = requestAnimationFrame(() => {
      previewFrame.current = null;
      previewAtPointer();
    });
  }
  return <main className={styles.page}><div className={styles.container}>
    <DragonSectionHeader active="scale" count={dragons.length} />
    <div className={styles.workbench}>
    <div className={styles.stagePanel}>
    <section className={styles.comparison} aria-label="Dragon size comparison">
      <div className={styles.toolbar}><div className={styles.mode}><button aria-pressed={mode === "overlay"} onClick={() => setMode("overlay")}>Overlay</button><button aria-pressed={mode === "rows"} onClick={() => setMode("rows")}>Separate rows</button></div><label className={styles.zoom}>Zoom <input aria-label="Stage zoom" type="range" min={stage.minZoom} max={stage.maxZoom} step={stage.zoomStep} value={zoom} onChange={e => setZoom(Number(e.target.value))} /><span>{Math.round(zoom * 100)}%</span></label><button onClick={reset}>Reset</button></div>
      <div className={styles.stageHeading}><span>Length from snout to tail</span><span>One shared scale · metres</span></div>
      <div ref={viewport} className={styles.viewport} tabIndex={0} role="region" aria-label="Dragon silhouettes; scroll horizontally to explore">
        <div className={styles.canvas} style={{ width: stageWidth, minHeight: height + stage.rulerHeight }}>
          <div className={styles.gridLines} aria-hidden="true">{Array.from({ length: Math.floor(stage.axisMaxMetres / stage.axisStepMetres) + 1 }, (_, i) => <i key={i} style={{ left: stage.originX + i * stage.axisStepMetres * ppm }} />)}</div>
          {mode === "overlay" ? <div className={styles.overlay} style={{ height }}>
            {active.map((d, i) => <div key={d.id} className={styles.silhouette} style={{ left: stage.originX, bottom: 0, zIndex: preview === d.id ? 40 : i + 1, opacity: preview && preview !== d.id ? 0.32 : selected.includes(d.id) ? 1 : 0.65 }}><Shape dragon={d} width={d.length * ppm} /></div>)}
            <svg className={styles.human} aria-label={`Human reference, ${human.heightMetres} metres tall`} role="img" style={{ left: stage.originX - human.gapFromOrigin - human.widthMetres * ppm }} width={human.widthMetres * ppm} height={human.heightMetres * ppm} viewBox="0 0 56 185">
              <ellipse cx="28" cy="12" rx="9" ry="12" />
              <path d="M23 23Q23 28 19 30L12 33Q8 35 7 44L2 77Q0 86 4 90Q7 92 9 86L14 59L15 85Q12 99 15 116L17 167L14 178Q11 182 13 185H25L27 177L26 130L28 111L30 130L29 177L31 185H43Q45 182 42 178L39 167L41 116Q44 99 41 85L42 59L47 86Q49 92 52 90Q56 86 54 77L49 44Q48 35 44 33L37 30Q33 28 33 23Z" />
            </svg>
          </div> : <div className={styles.rows}>{active.map(d => <div className={styles.row} key={d.id}><div className={styles.rowLabel}>{d.name}<span>{measure(d)}</span></div><div style={{ marginLeft: stage.originX }}><Shape dragon={d} width={d.length * ppm} /></div></div>)}</div>}
          {!active.length && <p className={styles.empty}>Choose a dragon to cast its shadow.</p>}
          <div className={styles.ruler} aria-hidden="true">{Array.from({ length: Math.floor(stage.axisMaxMetres / stage.axisStepMetres) + 1 }, (_, i) => <span key={i} style={{ left: stage.originX + i * stage.axisStepMetres * ppm }}>{i * stage.axisStepMetres}<small> m</small></span>)}</div>
        </div>
      </div>
      <div className={styles.stageFooter}><span>{selected.length} selected · {mode === "overlay" ? "Largest behind, smallest in front" : "Aligned at the snout"}</span><span>Human reference: {human.heightMetres} m · Scroll to explore</span></div>
    </section>
    <div className={styles.selection} aria-label="Selected dragons">{dragons.filter(d => selected.includes(d.id)).map(d => <button key={d.id} onClick={() => toggle(d.id)} aria-label={`Remove ${d.name}`}><i style={{ background: d.color }} />{d.name}<span aria-hidden="true">×</span></button>)}{selected.length > 0 && <button className={styles.clear} onClick={() => { setSelected([]); setPreview(null); }}>Clear selection</button>}</div>
    </div>
    <section className={styles.catalog} aria-labelledby="choose-dragons"><div className={styles.catalogHeader}><div><p className={styles.eyebrow}>Build your comparison</p><h2 id="choose-dragons">Choose your dragons</h2></div><p>Hover or focus to preview. Select to keep on the stage.</p></div>
      <div className={styles.catalogControls}><div className={styles.filterDisclosure} onKeyDown={e => { if (e.key === "Escape") { setFiltersOpen(false); e.currentTarget.querySelector("button")?.focus(); } }}><button type="button" className={styles.filterToggle} aria-expanded={filtersOpen} aria-controls="dragon-filter-panel" onClick={() => setFiltersOpen(open => !open)}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4.5h14L11.7 10v4.2l-3.4 1.5V10L3 4.5Z" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" /></svg><span>Filters</span>{filter !== "All" && <span className={styles.filterBadge}>1</span>}</button><div id="dragon-filter-panel" className={styles.filters} role="group" aria-label="Filter dragon records" hidden={!filtersOpen}>{filters.map(f => <button key={f} aria-pressed={filter === f} onClick={() => { setFilter(f); setPreview(null); }}>{f}</button>)}</div></div><input className={styles.search} type="search" aria-label="Search dragons" placeholder="Find a dragon…" value={query} onChange={e => setQuery(e.target.value)} /></div>
      <div className={styles.cards} data-dragon-picker onPointerMove={event => { if (event.pointerType === "mouse") { pointerPosition.current = { x: event.clientX, y: event.clientY }; const card = (event.target as HTMLElement).closest<HTMLElement>("[data-dragon-id]"); setPreview(card?.dataset.dragonId ?? null); } }} onPointerLeave={() => { pointerPosition.current = null; setPreview(null); }} onScroll={schedulePreviewAtPointer}>{filtered.map(d => <button key={d.id} data-dragon-id={d.id} className={styles.card} aria-pressed={selected.includes(d.id)} onClick={() => toggle(d.id)} onFocus={e => { if (e.currentTarget.matches(":focus-visible")) setPreview(d.id); }} onBlur={() => { if (!pointerPosition.current) setPreview(null); }}><span className={styles.check} aria-hidden="true">{selected.includes(d.id) ? "✓" : "+"}</span><i className={styles.swatch} style={{ background: d.color }} /><span className={styles.cardName}>{d.name}<small>{d.source}{d.uncertain ? " · Shape uncertain" : ""}</small></span><span className={styles.length}>{measure(d)}</span></button>)}</div>
      {!filtered.length && <p className={styles.noResults}>No dragons match this search.</p>}
      <div className={styles.detail} aria-live="polite">{current ? <><strong>{current.name}</strong><span>Length {measure(current)}</span><span>Wingspan ≈ {current.wingspan} m</span><span>{current.source} reference{current.uncertain ? " · Unconfirmed silhouette" : ""}</span></> : <span>Every silhouette keeps its original proportions. All dragons begin at the same point on the ruler.</span>}</div>
    </section>
    </div>
    <footer className={styles.notes}><p><strong>A note on the scale</strong> Measurements are estimates from the supplied illustration, not official dimensions. Screen versions are used where supplied; the remaining records use book references. ≥ marks a lower-bound estimate. Vertical size follows the original silhouette?s proportions and pose; it is not a confirmed standing height. Folded wings may be the highest point and do not represent wingspan.</p><p>Illustration credited to <strong>fanglycan.commissions.open</strong> in the <a href="https://www.reddit.com/r/HouseOfTheDragon/comments/1q4sd0a/this_is_probably_the_best_illustration_of_dragon/" target="_blank" rel="noreferrer">original comparison</a>. Morghul & Shrykos share one supplied silhouette record.</p></footer>
  </div></main>;
}
