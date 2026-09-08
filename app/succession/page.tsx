import Link from "next/link";
import MiniPortrait from "@/components/MiniPortrait";
import { getSuccessionLine } from "@/lib/succession";
import styles from "./succession.module.css";

function roman(value: number) { const values: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]; let result = ""; for (const [number, symbol] of values) while (value >= number) { result += symbol; value -= number; } return result; }

export default function SuccessionPage() { const line = getSuccessionLine(); return <main className={styles.page}><div className={styles.container}><p className={styles.eyebrow}>The Crown&apos;s Question</p><h1>Succession</h1><p className={styles.lead}>Primogeniture, male preference, representation, and the branches that follow a crown.</p><div className={styles.rules}><span>Children before collateral lines</span><span>Sons before daughters</span><span>Each branch before the next sibling</span><span>Malaenar · Renounced</span></div><div className={styles.line}>{line.map((entry) => <Link href={`/characters/${entry.character.id}`} className={styles.heir} key={entry.character.id}><span className={styles.number}>{roman(entry.rank)}</span><MiniPortrait id={entry.character.id} alt={entry.character.name} size={64}/><div><h2>{entry.character.name}</h2><p>{entry.character.title}</p><small>{entry.reason}</small></div></Link>)}</div></div></main>; }
