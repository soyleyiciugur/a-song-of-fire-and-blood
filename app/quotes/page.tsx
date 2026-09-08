import Link from "next/link";
import quotes from "@/data/quotes.json";
import CharacterQuote from "@/components/character/CharacterQuote";
import styles from "../records/records.module.css";

export const metadata = { title: "Echoes of the Realm" };
export default function QuotesPage() {
  return <main className={styles.page}><header className={styles.pageHeader}><p className={styles.eyebrow}>The Citadel&apos;s Archive</p><h1 className="realm-page-title">Echoes of the Realm</h1><p className={styles.pageIntro}>Vows, warnings, and words that linger after the page is turned.</p></header><div className={styles.shelf}>{quotes.filter((quote) => quote.chapterSlug).map((quote,index) => <article className={styles.recordCard} key={`${quote.speakerId}-${index}`}><CharacterQuote quote={quote} showAttribution/></article>)}</div><Link href="/records" className={styles.backLink}>← Records of the Realm</Link></main>;
}
