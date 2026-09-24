import Image from "next/image";
import Link from "next/link";
import ChronicleTabs from "@/components/chronicle/ChronicleTabs";
import { getAllChapters } from "@/data/chapters";
import events from "@/data/events.json";
import { isMapEventType, MAP_EVENT_TYPE_ICONS, MAP_EVENT_TYPE_LABELS, type MapEventType } from "@/types/map";
import styles from "./chronicle.module.css";

const chapters = getAllChapters();
const annalEvents = events.filter((event) => isMapEventType(event.type)) as Array<(typeof events)[number] & { type: MapEventType }>;

export default function AnnalsPage() {
  return <main className={styles.page}><div className={styles.container}>
    <div className="realm-section-header">
      <p className={styles.eyebrow}>The Historical Record</p>
      <h1 className="realm-page-title">The Chronicle</h1>
      <p className={styles.lead}>The turning points, secrets, and reckonings of the realm.</p>
      <ChronicleTabs active="annals" className={styles.tabs} activeClassName={styles.activeTab} />
    </div>
    <h2 className={styles.sectionTitle}>Annals</h2>
    <div className={styles.grid}>{annalEvents.map((event) => {
      const chapter = chapters.find((item) => item.slug === event.chapterSlug);
      return <article id={event.id} className={styles.card} key={event.id}>
        <div className={styles.cardKind}><Image src={MAP_EVENT_TYPE_ICONS[event.type]} alt="" width={22} height={22} /><span>{MAP_EVENT_TYPE_LABELS[event.type]} · {event.day}/{event.moon}/{event.year} AC</span></div>
        <h2>{event.title}</h2><p>{event.description}</p>
        <div className={styles.cardLinks}><Link href={`/map?location=${encodeURIComponent(event.location)}`}>{event.location}</Link>{chapter && <Link href={`/chapters/${chapter.slug}`}>{chapter.title} →</Link>}</div>
      </article>;
    })}</div>
  </div></main>;
}
