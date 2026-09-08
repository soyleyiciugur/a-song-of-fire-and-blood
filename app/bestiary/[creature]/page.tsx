import Link from "next/link";
import styles from "../bestiary.module.css";

const titles: Record<string, string> = { direwolves: "Direwolves", dogs: "Dogs", cats: "Cats" };
const tabs = [["/bestiary", "Dragons"], ["/bestiary/direwolves", "Direwolves"], ["/bestiary/dogs", "Dogs"], ["/bestiary/cats", "Cats"]] as const;
export default async function CreaturePage({ params }: { params: Promise<{ creature: string }> }) { const { creature } = await params; const title = titles[creature] ?? "Creatures"; return <main className={styles.page}><div className={styles.container}><p className={styles.eyebrow}>The Bestiary</p><h1>{title}</h1><p className={styles.lead}>A record waiting for the beasts of this chronicle to be entered.</p><nav className={styles.tabs}>{tabs.map(([href, label]) => <Link className={href === `/bestiary/${creature}` ? styles.active : ""} href={href} key={href}>{label}</Link>)}</nav><section className={styles.panel}><h2>The record is unwritten</h2><p>Entries for {title.toLowerCase()} can be added through the same data-driven bestiary structure when their lore and portraits are ready.</p></section></div></main>; }
