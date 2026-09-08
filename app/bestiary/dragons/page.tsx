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

  return (
    <article className={`${styles.card} ${dragon.status === "Dead" ? styles.cardDead : ""}`}>
      <SigilImage src={dragon.image} alt={dragon.name} shape="rounded" size={96} fallbackText={dragon.name.slice(0, 2)} />
      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <h3 className={styles.dragonName}>
            <Link href={`/dragons/${dragon.id}`} className={styles.cardLink}>{dragon.name}</Link>
          </h3>
          <span className={`${styles.statusBadge} ${dragon.status === "Alive" ? styles.statusAlive : styles.statusDead}`}>
            {dragon.status === "Alive" ? "●" : "✕"} {dragon.status}
          </span>
        </div>
        <p className={styles.description}>{dragon.description}</p>
        {rider && (
          <div className={styles.riders}>
            <Link href={`/characters/${rider.id}`} className={styles.riderChip}>
              <MiniPortrait id={rider.id} alt={rider.name} />
              <span>
                <span className={styles.riderLabel}>Rider</span>
                <span className={styles.riderName}>{rider.name}</span>
              </span>
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
