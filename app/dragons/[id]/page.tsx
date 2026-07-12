// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\dragons\[id]\page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";

import { dragons, getDragon } from "@/data/dragons";
import { getCharacter } from "@/lib/characters";
import SigilImage from "@/components/SigilImage";
import MiniPortrait from "@/components/MiniPortrait";

import styles from "./dragon.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return dragons.map((dragon) => ({ id: dragon.id }));
}

export default async function DragonPage({ params }: Props) {
  const { id } = await params;
  const dragon = getDragon(id);

  if (!dragon) notFound();

  const rider = dragon.riderId ? getCharacter(dragon.riderId) : undefined;
  const previousRider = dragon.previousRiderId
    ? getCharacter(dragon.previousRiderId)
    : undefined;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <SigilImage
            src={dragon.image}
            alt={dragon.name}
            shape="rounded"
            size={140}
            fallbackText={dragon.name.slice(0, 2)}
          />

          <div>
            <h1 className={styles.dragonName}>{dragon.name}</h1>

            <span
              className={`${styles.statusBadge} ${
                dragon.status === "Alive" ? styles.statusAlive : styles.statusDead
              }`}
            >
              {dragon.status === "Alive" ? "●" : "✕"} {dragon.status}
            </span>
          </div>
        </div>

        <p className={styles.description}>{dragon.description}</p>

        <h2 className={styles.sectionHeading}>Traits</h2>
        <div className={styles.traits}>
          {dragon.traits.map((trait) => (
            <span key={trait} className={styles.traitChip}>
              {trait}
            </span>
          ))}
        </div>

        {(rider || previousRider) && (
          <>
            <h2 className={styles.sectionHeading}>Riders</h2>
            <div className={styles.riders}>
              {rider && (
                <Link
                  href={`/characters/${rider.id}`}
                  className={styles.riderChip}
                >
                  <MiniPortrait id={rider.id} alt={rider.name} />
                  <span>
                    <span className={styles.riderLabel}>Current Rider</span>
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
                      {rider ? "Formerly Ridden By" : "Once Bonded To"}
                    </span>
                    <span className={styles.riderName}>
                      {previousRider.name}
                    </span>
                  </span>
                </Link>
              )}
            </div>
          </>
        )}

        <Link href="/dragons" className={styles.backLink}>
          ← Back to Dragons
        </Link>
      </div>
    </main>
  );
}