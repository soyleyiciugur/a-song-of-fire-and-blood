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
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Characters</h1>

        <ul className={styles.list}>
          {characters.map((character) => (
            <li key={character.id} className={styles.listItem}>
              <Link
                href={`/characters/${character.id}`}
                className={styles.card}
              >
                <MiniPortrait
                  id={character.id}
                  alt={character.name}
                />

                <span>
                  {character.name.split(" ")[0]}{" "}
                  {character.nickname !== "-" && (
                    <span className={styles.nickname}>
                      "{character.nickname}"
                    </span>
                  )}{" "}
                  {character.name.split(" ").slice(1).join(" ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}