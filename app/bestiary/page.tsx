import Link from "next/link";
import { beastTypes } from "@/components/BestiaryTabs";
import styles from "./bestiary.module.css";

export default function BestiaryPage() {
  return <main className={styles.page}><div className={styles.container}><p className={styles.eyebrow}>Creatures Great and Small</p><h1 className="realm-page-title">The Bestiary</h1><p className={styles.lead}>The beasts that run, fly, hunt, and howl through the chronicles.</p><div className={styles.dragonList}>{beastTypes.map((beast) => <Link href={`/bestiary/${beast.id}`} key={beast.id} className={styles.panel}><h2>{beast.name}</h2><p>{beast.description}</p></Link>)}</div></div></main>;
}
