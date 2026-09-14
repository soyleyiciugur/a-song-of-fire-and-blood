"use client";

import { useMemo, useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import { MAP_LOCATION_NAMES } from "@/data/map/locations";
import { NAME_CULTURES } from "@/data/nameGenerator";
import { generateName, type GeneratedName } from "@/lib/nameGenerator";
import { calculateTravel, type TravelResult } from "@/lib/travel";
import styles from "./workbench.module.css";

const LOCATION_OPTIONS = MAP_LOCATION_NAMES.map((name) => ({ value: name, label: name }));
const CULTURE_OPTIONS = NAME_CULTURES.map((culture) => ({ value: culture.id, label: `${culture.name} · ${culture.group}` }));

const fmtDays = (days: number) => {
  if (days < .5) return `${Math.max(1, Math.round(days * 24))} hours`;
  const rounded = Math.max(1, Math.round(days));
  return `${rounded} day${rounded === 1 ? "" : "s"}`;
};
const fmtRange = (a: number, b: number, unit: string) => `${Math.max(1, Math.round(a))}–${Math.max(1, Math.round(b))} ${unit}`;

function ToolMark({ kind }: { kind: "roads" | "names" }) {
  return kind === "roads" ? (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M6 22c4-8 5-12 5-17m11 18c-4-5-5-10-5-18M8.5 17.5h11M9.7 12h8.6" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/><path d="M14 4.5v19" stroke="currentColor" strokeWidth="1.1" strokeDasharray="2.2 3.2"/></svg>
  ) : (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M20.8 4.8c-5.2.8-9.8 4.5-12.5 10.4-.8 1.8-1.3 3.7-1.6 5.9 2.2-.2 4.2-.8 6-1.7 5.6-2.9 8.9-8 8.1-14.6Z" stroke="currentColor" strokeWidth="1.35"/><path d="M7.4 20.5c3.4-4.5 6.8-7.5 10.3-9.3M5.5 23h11" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/></svg>
  );
}

export default function WorkbenchPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cultureId, setCultureId] = useState(NAME_CULTURES[0]?.id ?? "north");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [mode, setMode] = useState<"curated" | "procedural">("curated");
  const [includeByname, setIncludeByname] = useState(true);
  const [nameResult, setNameResult] = useState<GeneratedName | null>(null);
  const [nameHistory, setNameHistory] = useState<GeneratedName[]>([]);
  const [copied, setCopied] = useState(false);

  const travel: TravelResult | null = useMemo(() => from && to && from !== to ? calculateTravel(from, to) : null, [from, to]);

  const generate = () => {
    const next = generateName(mode, cultureId, gender, includeByname, nameResult?.full);
    if (!next) return;
    setNameResult(next);
    setNameHistory((current) => [next, ...current.filter((entry) => entry.full !== next.full)].slice(0, 6));
    setCopied(false);
  };

  const copyName = async () => {
    if (!nameResult) return;
    await navigator.clipboard.writeText(nameResult.full);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1300);
  };

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.kicker}>Realm utilities</p>
        <h1>The Workbench</h1>
        <p>Practical instruments for plotting journeys, naming souls, and keeping the realm moving.</p>
      </header>

      <section className={styles.toolGrid}>
        <article className={styles.toolCard}>
          <div className={styles.toolHeading}>
            <span className={styles.toolIcon}><ToolMark kind="roads" /></span>
            <div><p>Distance & passage</p><h2>Roads & Ravens</h2></div>
          </div>
          <p className={styles.toolIntro}>Estimate passage between known places by foot, horse, army, sea, dragonback, or raven. A roleplay aid, not gospel.</p>
          <div className={styles.selectGrid}>
            <label><span>From</span><SearchableSelect value={from} onChange={setFrom} options={LOCATION_OPTIONS} placeholder="Choose a place" searchPlaceholder="Search the map…" /></label>
            <label><span>To</span><SearchableSelect value={to} onChange={setTo} options={LOCATION_OPTIONS} placeholder="Choose a place" searchPlaceholder="Search the map…" /></label>
          </div>
          {from && to && from === to && <p className={styles.hint}>Choose two different places.</p>}
          {travel && <>
            <div className={styles.travelResults}>
              {([
                ["On foot", fmtDays(travel.footDays)],
                ["Horseback", fmtRange(travel.horseDays[0], travel.horseDays[1], "days")],
                ["With an army", fmtRange(travel.armyDays[0], travel.armyDays[1], "days")],
                ["By sea", fmtDays(travel.seaDays)],
                ["Dragonback", fmtRange(travel.dragonHours[0], travel.dragonHours[1], "hours")],
                ["By raven", travel.ravenHours < 24 ? `${Math.max(1, Math.round(travel.ravenHours))} hours` : fmtDays(travel.ravenHours / 24)],
              ] as [string, string][]).map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}
            </div>
            <p className={styles.distanceNote}>≈ {Math.round(travel.landMiles)} land miles · ≈ {Math.round(travel.seaMiles)} sea miles</p>
          </>}
        </article>

        <article className={styles.toolCard}>
          <div className={styles.toolHeading}>
            <span className={styles.toolIcon}><ToolMark kind="names" /></span>
            <div><p>People & tongues</p><h2>The Namesmith</h2></div>
          </div>
          <p className={styles.toolIntro}>Forge region-shaped names for nobles, retainers, smallfolk, Free Folk, and peoples across the Narrow Sea.</p>
          <div className={styles.nameControls}>
            <label className={styles.cultureField}><span>Culture</span><SearchableSelect value={cultureId} onChange={setCultureId} options={CULTURE_OPTIONS} searchPlaceholder="Search cultures…" /></label>
            <fieldset><legend>Gender</legend><div className={styles.segmented}><button type="button" data-active={gender === "male"} onClick={() => setGender("male")}>Male</button><button type="button" data-active={gender === "female"} onClick={() => setGender("female")}>Female</button></div></fieldset>
            <fieldset><legend>Method</legend><div className={styles.segmented}><button type="button" data-active={mode === "curated"} onClick={() => setMode("curated")}>Lore-shaped</button><button type="button" data-active={mode === "procedural"} onClick={() => setMode("procedural")}>Forge anew</button></div></fieldset>
          </div>
          <button type="button" className={styles.checkRow} aria-pressed={includeByname} onClick={() => setIncludeByname((value) => !value)}><span className={styles.checkBox}>{includeByname && <svg viewBox="0 0 14 12" fill="none"><path d="m2 6 3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}</span><span>Allow a byname or trade-name</span></button>
          <button type="button" className={styles.primary} onClick={generate}>Forge a name</button>
          {nameResult && <div className={styles.nameResult}>
            <div><small>Fresh from the ledger</small><strong>{nameResult.full}</strong>{nameResult.byname && <span>{nameResult.given}{nameResult.surname ? ` · ${nameResult.surname}` : ""} · {nameResult.byname}</span>}</div>
            <button type="button" onClick={() => void copyName()}>{copied ? "Copied" : "Copy"}</button>
          </div>}
          {nameHistory.length > 1 && <div className={styles.history}><small>Recent names</small><div>{nameHistory.slice(1).map((entry) => <button type="button" key={entry.full} onClick={() => setNameResult(entry)}>{entry.full}</button>)}</div></div>}
        </article>
      </section>
    </main>
  );
}
