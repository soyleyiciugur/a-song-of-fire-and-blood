import Link from "next/link";

import { dragons } from "@/data/dragons";
import { getCharacter } from "@/lib/characters";
import MiniPortrait from "@/components/MiniPortrait";

import styles from "./dragons.module.css";

export default function Dragons() {
  const alive = dragons.filter((d) => d.status === "Alive");
  const dead = dragons.filter((d) => d.status === "Dead");

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Dragons</h1>

        <p className={styles.subheading}>
          The living fire of House Targaryen, and the flames that went out
          too soon.
        </p>

        <section className={styles.group}>
          <h2 className={styles.groupHeading}>Living</h2>

          <div className={styles.grid}>
            {alive.map((dragon) => (
              <DragonCard key={dragon.id} dragon={dragon} />
            ))}
          </div>
        </section>

        {dead.length > 0 && (
          <section className={styles.group}>
            <h2 className={styles.groupHeading}>Lost</h2>

            <div className={styles.grid}>
              {dead.map((dragon) => (
                <DragonCard key={dragon.id} dragon={dragon} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function DragonCard({ dragon }: { dragon: (typeof dragons)[number] }) {
  const rider = dragon.riderId ? getCharacter(dragon.riderId) : undefined;
  const previousRider = dragon.previousRiderId
    ? getCharacter(dragon.previousRiderId)
    : undefined;

  return (
    <article
      id={dragon.id}
      className={`${styles.card} ${
        dragon.status === "Dead" ? styles.cardDead : ""
      }`}
    >
      <div className={styles.cardHeader}>
        <h3 className={styles.dragonName}>{dragon.name}</h3>

        <span
          className={`${styles.statusBadge} ${
            dragon.status === "Alive" ? styles.statusAlive : styles.statusDead
          }`}
        >
          {dragon.status === "Alive" ? "●" : "✕"} {dragon.status}
        </span>
      </div>

      <p className={styles.description}>{dragon.description}</p>

      <div className={styles.riders}>
        {rider && (
          <Link href={`/characters/${rider.id}`} className={styles.riderChip}>
            <MiniPortrait id={rider.id} alt={rider.name} />
            <span>
              <span className={styles.riderLabel}>Rider</span>
              <span className={styles.riderName}>{rider.name}</span>
            </span>
          </Link>
        )}

        {previousRider && (
          <Link
            href={`/characters/${previousRider.id}`}
            className={styles.riderChip}
          >
            <MiniPortrait id={previousRider.id} alt={previousRider.name} />
            <span>
              <span className={styles.riderLabel}>
                {rider ? "Formerly" : "Once bonded to"}
              </span>
              <span className={styles.riderName}>{previousRider.name}</span>
            </span>
          </Link>
        )}
      </div>
    </article>
  );
}
