import Link from "next/link";
import Image from "next/image";
import gallery from "@/data/gallery.json";
import { getAllChapters } from "@/data/chapters";
import styles from "./latestUpdates.module.css";

const videoExtensions = [".mp4", ".mov", ".webm"];
const isVideo = (src: string) => videoExtensions.some((extension) => src.endsWith(extension));

export default function LatestUpdates() {
  const ordered = [...gallery].sort((a, b) => (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? ""));
  const latestMedia = [
    ordered.find((item) => !isVideo(item.src) && item.category === "raven"),
    ordered.find((item) => !isVideo(item.src) && item.category === "fleabottom"),
    ordered.find((item) => isVideo(item.src)),
  ].filter((item): item is (typeof gallery)[number] => Boolean(item));
  const latestChapter = getAllChapters().at(-1);
  return <section className={styles.section} aria-labelledby="latest-title"><div className={styles.heading}><div><span>Recent dispatches</span><h2 id="latest-title">Latest Updates</h2></div><Link href="/ravens-eye">The Raven&apos;s Eye →</Link></div><div className={styles.grid}>{latestChapter && <div className={`${styles.card} ${styles.chapter}`}><span className={styles.label}>Latest chapter</span><Link href={`/chapters/${latestChapter.slug}`}><h3>{latestChapter.title}</h3></Link><p>{latestChapter.synopsis}</p><div className={styles.actions}><Link href={`/chapters/${latestChapter.slug}`}>Read chapter →</Link><Link href={`/map?chapter=${latestChapter.slug}`}>Explore the map →</Link></div></div>}{latestMedia.map((item) => <Link href={`${isVideo(item.src) ? "/ravens-eye/reels" : "/ravens-eye"}?item=${encodeURIComponent(item.id)}`} className={`${styles.card} ${styles.mediaCard}`} key={item.id}>{item.src && !isVideo(item.src) ? <Image src={item.src} alt={item.caption ?? "Raven's Eye"} fill sizes="(max-width: 800px) 50vw, 25vw"/> : <video src={item.src} muted loop autoPlay playsInline aria-label="Latest reel" />}<div className={styles.mediaCaption}><span className={styles.label}>{isVideo(item.src) ? "Latest Reel" : item.category === "fleabottom" ? "Latest Meme" : "Latest Image"}</span><h3>{item.caption || "A new sighting from the Raven's Eye"}</h3></div></Link>)}</div></section>;
}
