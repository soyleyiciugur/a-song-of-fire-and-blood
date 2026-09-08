"use client";
import { useState } from "react";
import { dragons } from "@/data/dragons";
import styles from "./scale.module.css";

type Source = "all" | "got" | "hotd" | "asofab";
const sourceLabels: Record<Source, string> = { all: "All", got: "GoT", hotd: "HotD", asofab: "ASOFAB" };
export default function DragonScalePage() { const [source, setSource] = useState<Source>("all"); const visible = dragons.filter((dragon) => source === "all" || source === "asofab"); return <main className={styles.page}><div className={styles.container}><p className={styles.eyebrow}>A Comparative Record</p><h1>Dragon Scale</h1><p className={styles.lead}>A shared scale for the creatures of fire. Measured outlines will be added as the record grows.</p><div className={styles.filters}>{(Object.keys(sourceLabels) as Source[]).map((key) => <button key={key} className={source === key ? styles.active : ""} onClick={() => setSource(key)}>{sourceLabels[key]}</button>)}</div><section className={styles.chart}>{visible.map((dragon, index) => <div className={styles.row} key={dragon.id}><span>{dragon.name}</span><div className={styles.track}><div className={styles.bar} style={{ width: `${Math.max(18, 100 - index * 7)}%` }} /></div><small>Scale profile pending</small></div>)}</section></div></main>; }
