// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\houses\page.tsx
import Link from "next/link";

import { houses } from "@/data/houses";
import { getCharacters } from "@/lib/characters";
import SigilImage from "@/components/SigilImage";

import styles from "./houses.module.css";

export default function Houses() {
  const characters = getCharacters();

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Houses</h1>

        <p className={styles.subheading}>
          The great and lesser houses whose banners, words, and blood shape
          the realm.
        </p>

        <div className={styles.grid}>
          {[...houses]
            .sort((a, b) => {
              const aIsTargaryen = a.name.toLowerCase().includes("targaryen");
              const bIsTargaryen = b.name.toLowerCase().includes("targaryen");
              if (aIsTargaryen) return -1;
              if (bIsTargaryen) return 1;
              return a.name.localeCompare(b.name);
            })
            .map((house) => {
            const memberCount = characters.filter(
              (c) => c.house === house.name
            ).length;

            return (
              <Link
                key={house.id}
                href={`/houses/${house.id}`}
                className={styles.card}
                style={{ "--house-color": house.color } as React.CSSProperties}
              >
                <div className={styles.cardTop} />

                <SigilImage
                  src={house.sigilSrc}
                  alt={house.name}
                  size={72}
                  fallbackText={house.name.replace("House ", "").slice(0, 2)}
                />

                <h2 className={styles.houseName}>{house.name}</h2>
                <p className={styles.houseWords}>&ldquo;{house.words}&rdquo;</p>

                <span className={styles.memberCount}>
                  {memberCount} {memberCount === 1 ? "member" : "members"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}