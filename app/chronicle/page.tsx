import Link from "next/link";
import { timeline } from "@/data/timeline";
import styles from "./chronicle.module.css";

export default function ChroniclePage() {
  return <main className={styles.page}><div className={styles.container}>
    <p className={styles.eyebrow}>The Historical Record</p><h1>The Chronicle</h1>
    <p className={styles.lead}>The turning points, secrets, and reckonings of the realm.</p>
    <nav className={styles.tabs}><Link href="/timeline">Timeline</Link><Link className={styles.activeTab} href="/chronicle">Annals</Link><Link href="/wars">The Bloodshed</Link></nav>
    <h2 className={styles.sectionTitle}>Annals</h2>
    <div className={styles.grid}>{timeline.flatMap((chapter) => chapter.events.map((event) => <article className={styles.card} key={`${chapter.chapterSlug}-${event.title}`}>
      <span>{event.date ?? chapter.date ?? "Undated"}</span><h2>{event.title}</h2><p>{event.description}</p>
      <Link href={`/chapters/${chapter.chapterSlug}`}>{chapter.chapterTitle} →</Link>
    </article>))}</div>
  </div></main>;
}
