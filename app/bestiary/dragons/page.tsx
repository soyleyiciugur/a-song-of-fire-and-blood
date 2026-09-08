import Link from "next/link";
import { dragons } from "@/data/dragons";
import { getCharacter } from "@/lib/characters";
import MiniPortrait from "@/components/MiniPortrait";
import SigilImage from "@/components/SigilImage";
import BestiaryTabs from "@/components/BestiaryTabs";
import styles from "../../dragons/dragons.module.css";

export default function DragonsPage() {
  return <main className={styles.page}><div className={styles.container}><h1 className="realm-page-title">Dragons</h1><p className={styles.subheading}>The living fire of House Targaryen, and the flames that went out too soon.</p><BestiaryTabs active="dragons" />{(["Alive", "Dead"] as const).map((status) => <section className={styles.group} key={status}><h2 className={styles.groupHeading}>{status === "Alive" ? "Living" : "Lost"}</h2><div className={styles.grid}>{dragons.filter((dragon) => dragon.status === status).map((dragon) => <DragonCard key={dragon.id} dragon={dragon}/>)}</div></section>)}</div></main>;
}

function DragonCard({ dragon }: { dragon: (typeof dragons)[number] }) {
  const rider = dragon.riderId ? getCharacter(dragon.riderId) : undefined;
  const previous = dragon.previousRiderId ? getCharacter(dragon.previousRiderId) : undefined;
  return <article className={`${styles.card} ${dragon.status === "Dead" ? styles.cardDead : ""}`}>
    <Link href={`/dragons/${dragon.id}`} aria-label={dragon.name}><SigilImage src={dragon.image} alt={dragon.name} shape="rounded" size={96} fallbackText={dragon.name.slice(0,2)}/></Link>
    <div className={styles.cardBody}><div className={styles.cardHeader}><h3 className={styles.dragonName}><Link href={`/dragons/${dragon.id}`}>{dragon.name}</Link></h3><span className={`${styles.statusBadge} ${dragon.status === "Alive" ? styles.statusAlive : styles.statusDead}`}>{dragon.status === "Alive" ? "●" : "✕"} {dragon.status}</span></div><p className={styles.description}>{dragon.description}</p><div className={styles.riders}>{[{ character:rider, label:"Current Rider" },{ character:previous, label:rider ? "Formerly" : "Once bonded to" }].map(({character,label}) => character && <Link href={`/characters/${character.id}`} key={label} className={styles.riderChip}><MiniPortrait id={character.id} alt={character.name}/><span><span className={styles.riderLabel}>{label}</span><span className={styles.riderName}>{character.name}</span></span></Link>)}</div></div>
  </article>;
}
