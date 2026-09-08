import Link from "next/link";
import Image from "next/image";
import gallery from "@/data/gallery.json";
import { getAllChapters } from "@/data/chapters";
import styles from "./latestUpdates.module.css";

const videoExtensions = [".mp4", ".mov", ".webm"];
const isVideo = (src: string) => videoExtensions.some((extension) => src.endsWith(extension));

export default function LatestUpdates() {
  const latestMedia = [...gallery].sort((a, b) => (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? "")).slice(0, 3);
  const latestChapter = getAllChapters().at(-1);
  return <section className={styles.section} aria-labelledby="latest-title"><div className={styles.heading}><div><span>Recent dispatches</span><h2 id="latest-title">Latest Updates</h2></div><Link href="/ravens-eye">Raven&apos;s Eye →</Link></div><div className={styles.grid}>{latestChapter && <div className={`${styles.card} ${styles.chapter}`}><span className={styles.label}>Latest chapter</span><Link href={`/chapters/${latestChapter.slug}`}><h3>{latestChapter.title}</h3></Link><p>{latestChapter.synopsis}</p><div className={styles.actions}><Link href={`/chapters/${latestChapter.slug}`}>Read chapter →</Link><Link href={`/map?chapter=${latestChapter.slug}`}>Explore the map →</Link></div></div>}{latestMedia.map((item) => <Link href="/ravens-eye" className={styles.card} key={item.id}>{item.src && !isVideo(item.src) ? <Image src={item.src} alt={item.caption ?? "Raven's Eye"} width={280} height={150}/> : <div className={styles.video}>▶</div>}<span className={styles.label}>{isVideo(item.src) ? "Latest reel" : "Latest image"}</span><h3>{item.caption || "A new sighting from the Raven's Eye"}</h3></Link>)}</div></section>;
}
