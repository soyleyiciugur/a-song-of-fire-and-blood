"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dragons } from "@/data/dragons";
import { getCharacter } from "@/lib/characters";
import styles from "./bestiary.module.css";

const tabs = [["/bestiary", "Dragons"], ["/bestiary/direwolves", "Direwolves"], ["/bestiary/dogs", "Dogs"], ["/bestiary/cats", "Cats"]] as const;

export default function BestiaryPage() {
  const pathname = usePathname();
  return <main className={styles.page}><div className={styles.container}>
    <p className={styles.eyebrow}>Creatures Great and Small</p><h1>The Bestiary</h1>
    <p className={styles.lead}>The beasts that run, fly, hunt, and howl through the chronicles.</p>
    <nav className={styles.tabs} aria-label="Bestiary sections">{tabs.map(([href, label]) => <Link className={pathname === href ? styles.active : ""} href={href} key={href}>{label}</Link>)}</nav>
    <section className={styles.panel}><h2>Dragons</h2><p>The living fire of House Targaryen, and the flames that went out too soon.</p>
      <div className={styles.dragonList}>{dragons.map((dragon) => { const rider = dragon.riderId ? getCharacter(dragon.riderId) : undefined; return <Link className={styles.dragonCard} href={`/dragons/${dragon.id}`} key={dragon.id}><div className={styles.dragonImage}><Image src={dragon.image} alt="" fill sizes="96px" /></div><div className={styles.dragonInfo}><strong>{dragon.name}</strong><small className={dragon.status === "Alive" ? styles.alive : styles.dead}>{dragon.status}</small><span>{rider ? `Current rider: ${rider.name}` : "No current rider"}</span></div></Link>; })}</div>
    </section>
  </div></main>;
}
