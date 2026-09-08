"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dragons } from "@/data/dragons";
import styles from "./bestiary.module.css";

const tabs = [
  ["/bestiary", "Dragons"], ["/dragons/scale", "The Measure of Fire"],
  ["/bestiary/direwolves", "Direwolves"], ["/bestiary/dogs", "Dogs"], ["/bestiary/cats", "Cats"],
] as const;

export default function BestiaryPage() { const pathname = usePathname(); return <main className={styles.page}><div className={styles.container}><p className={styles.eyebrow}>Creatures Great and Small</p><h1>The Bestiary</h1><p className={styles.lead}>The beasts that run, fly, hunt, and howl through the chronicles.</p><nav className={styles.tabs} aria-label="Bestiary sections">{tabs.map(([href, label]) => <Link className={pathname === href ? styles.active : ""} href={href} key={href}>{label}</Link>)}</nav><section className={styles.panel}><h2>Dragons</h2><p>The living fire of House Targaryen, and the flames that went out too soon.</p><div className={styles.dragonList}>{dragons.map((dragon) => <Link href={`/dragons/${dragon.id}`} key={dragon.id}><span>{dragon.name}</span><small>{dragon.status}</small></Link>)}</div></section></div></main>; }
