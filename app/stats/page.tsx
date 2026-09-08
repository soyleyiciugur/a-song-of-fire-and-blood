import Link from "next/link";
import { getCharacters } from "@/lib/characters";
import { dragons } from "@/data/dragons";
import { houses } from "@/data/houses";
import { getAllChapters } from "@/data/chapters";
import events from "@/data/events.json";
import gallery from "@/data/gallery.json";
import styles from "./stats.module.css";

const facts = [["Characters", getCharacters().filter((c) => !c.hidden).length, "/characters"], ["Houses", houses.length, "/houses"], ["Dragons", dragons.length, "/bestiary"], ["Chapters", getAllChapters().length, "/chapters"], ["Recorded events", events.length, "/chronicle"], ["Raven's Eye", gallery.length, "/ravens-eye"]] as const;

export default function StatsPage() { return <main className={styles.page}><div className={styles.container}><p className={styles.eyebrow}>The Citadel&apos;s Archive</p><h1 className="realm-page-title">The Realm&apos;s Ledger</h1><p className={styles.lead}>A small measure of the world as it is currently recorded.</p><div className={styles.grid}>{facts.map(([label, value, href]) => <Link href={href} className={styles.card} key={label}><strong>{value}</strong><span>{label}</span></Link>)}</div></div></main>; }
