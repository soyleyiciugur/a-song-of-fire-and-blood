// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\characters\page.tsx
import Link from "next/link";

import { getCharacters } from "@/lib/characters";
import { getTitleRank } from "@/constants/titles";
import MiniPortrait from "@/components/MiniPortrait";

import styles from "./characters.module.css";

export default function Characters() {
  const characters = getCharacters().sort((a, b) => {
    const rankA = getTitleRank(a.title);
    const rankB = getTitleRank(b.title);

    if (rankA !== rankB) return rankA - rankB;

    return a.name.localeCompare(b.name);
  });

  return (
    <main className="page-shell">
      <div className="page-shell-inner">
        <h1 className="page-heading">Characters</h1>
        <p className="page-subheading">
          Every soul recorded across the realm — their houses, their blood, their bonds.
        </p>

        <section className={styles.hubGrid}>
          <Link href="/family-tree" className={styles.hubCard}>
            <span className={styles.hubCardLabel}>Family Tree</span>
            <p className={styles.hubCardDesc}>
              Trace bloodlines and unions across the great houses.
            </p>
            <span className={styles.hubCardArrow}>→</span>
          </Link>

          <Link href="/characters/relationships" className={styles.hubCard}>
            <span className={styles.hubCardLabel}>Relationships</span>
            <p className={styles.hubCardDesc}>
              Alliances, rivalries, and ties that bind the realm together.
            </p>
            <span className={styles.hubCardArrow}>→</span>
          </Link>
        </section>

        <div className="section-divider">
          <span className="section-divider-label">All Characters</span>
        </div>

        <ul className={styles.list}>
          {characters.map((character) => {
            const title = character.title !== "-" ? character.title : null;
            const shortTitle =
              title && title.length > 28 ? `${title.slice(0, 28).trim()}…` : title;
            const firstName = character.name.split(" ")[0];
            const restName = character.name.split(" ").slice(1).join(" ");

            return (
              <li key={character.id} className={styles.listItem}>
                <Link href={`/characters/${character.id}`} className={styles.card}>
                  <MiniPortrait id={character.id} alt={character.name} />

                  <span className={styles.cardName}>
                    {firstName} {restName}
                  </span>

                  {character.nickname !== "-" && (
                    <span className={styles.nickname}>
                      <q>{character.nickname}</q>
                    </span>
                  )}

                  <span className={styles.cardTitleSlot}>
                    {title && (
                      <span className={styles.cardTitle} title={title}>
                        {shortTitle}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}