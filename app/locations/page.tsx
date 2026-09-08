import Link from "next/link";
import locations from "@/data/map/locations.json";
import { getMapEvents } from "@/lib/events";
import styles from "./locations.module.css";

export default function LocationsPage() {
  const events = getMapEvents();
  return <main className={styles.page}><div className={styles.container}><p className={styles.eyebrow}>The Known World</p><h1>Locations</h1><p className={styles.lead}>Seats, strongholds, and places remembered by the map.</p><nav className={styles.tabs}><Link href="/map">Map</Link><Link className={styles.activeTab} href="/locations">Locations</Link></nav>
    <div className={styles.grid}>{locations.map((location) => { const count = events.filter((event) => event.location === location.name).length; return <Link className={styles.card} href={`/map?location=${encodeURIComponent(location.name)}`} key={location.name}><div className={styles.thumb} style={{ backgroundPosition: `${location.xPct}% ${location.yPct}%` }} /><h2>{location.name}</h2><span>{count ? `${count} recorded event${count === 1 ? "" : "s"}` : "Explore the map"}</span></Link>; })}</div>
  </div></main>;
}
