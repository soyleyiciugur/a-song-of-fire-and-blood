import Link from "next/link";
import events from "@/data/events.json";
import { getAllChapters } from "@/data/chapters";
import styles from "./chronicle.module.css";

const chapters = getAllChapters();

export default function ChroniclePage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>The Historical Record</p>
        <h1>The Chronicle</h1>
        <p className={styles.lead}>The turning points, secrets, and reckonings of the realm.</p>
        <nav className={styles.tabs} aria-label="Chronicle sections">
          <Link href="/timeline">Timeline</Link>
          <Link className={styles.activeTab} href="/chronicle">Annals</Link>
          <Link href="/wars">The Bloodshed</Link>
        </nav>
        <h2 className={styles.sectionTitle}>Annals</h2>
        <div className={styles.grid}>
          {events.map((event) => {
            const chapter = chapters.find((item) => item.slug === event.chapterSlug);
            return (
              <article className={styles.card} key={event.id}>
                <span>{event.type} · {event.day}/{event.moon}/{event.year} AC</span>
                <h2>{event.title}</h2>
                <p>{event.description}</p>
                <div className={styles.cardLinks}>
                  <Link href={`/map?location=${encodeURIComponent(event.location)}`}>{event.location}</Link>
                  {chapter && <Link href={`/chapters/${chapter.slug}`}>{chapter.title} →</Link>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
