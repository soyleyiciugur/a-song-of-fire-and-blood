import Link from "next/link";
import quotes from "@/data/quotes.json";
import QuotesContent from "./QuotesContent";
import styles from "../records/records.module.css";

export const metadata = { title: "Echoes of the Realm" };
export default function QuotesPage() {
  return <main className={styles.page}><Link href="/records" className={styles.backLink}>← Records of the Realm</Link><header className={styles.pageHeader}><p className={styles.eyebrow}>The Citadel&apos;s Archive</p><h1 className="realm-page-title">Echoes of the Realm</h1><p className={styles.pageIntro}>Vows, warnings, and words that linger after the page is turned.</p></header><QuotesContent quotes={quotes} /></main>;
}
