// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\chapters\page.tsx
import Link from "next/link";
import { getAllChapters } from "@/data/chapters";
import styles from "./chapters.module.css";

export default function Chapters() {
  const chapters = getAllChapters();

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>
          Chronicles of the Realm
        </h1>

        <p className={styles.subheading}>
          A fragmented record of truth, betrayal, and blood.
        </p>

        <ul className={styles.list}>
          {chapters.map((chapter) => (
            <li key={chapter.slug} className={styles.listItem}>
              <Link
                href={`/chapters/${chapter.slug}`}
                className={styles.card}
              >
                <h2 className={styles.title}>
                  {chapter.title}
                </h2>

                <p className={styles.description}>
                  {chapter.synopsis}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}