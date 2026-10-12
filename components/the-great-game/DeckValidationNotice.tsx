import Link from "next/link";
import type { DeckValidationResult } from "@/lib/the-great-game/deck";
import styles from "./DeckValidationNotice.module.css";
export default function DeckValidationNotice({validation,editLink=false}:{validation:DeckValidationResult;editLink?:boolean}) {
  if (validation.valid) return <div className={styles.ready} role="status">
    <span className={styles.statusIcon} tabIndex={0} aria-label="Ready for the table"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m7.5 12 3 3 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square"/></svg><span className={styles.tooltip} role="tooltip">Ready for the table</span></span>
  </div>;
  return <details className={styles.details}>
    <summary><span className={styles.invalidIcon} aria-hidden="true">!</span><span>Not ready</span><span className={styles.detailAction}>Show details</span></summary>
    <div className={styles.detailBody} role="status"><ul>{validation.errors.map((error,index)=><li key={index}>{error}</li>)}</ul>{editLink&&<Link href="/cards/decks">Edit your deck</Link>}</div>
  </details>;
}
