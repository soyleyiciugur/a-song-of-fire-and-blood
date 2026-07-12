// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\scrolls\page.tsx
import Link from "next/link";
import { getAllScrolls, getScrollCategories } from "@/lib/scrolls";
import styles from "./scrolls.module.css";


export const metadata = {
  title: "Scrolls from the Realm",
};

export default function ScrollsPage() {
  const categories = getScrollCategories();
  const allScrolls = getAllScrolls();

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>The Citadel&apos;s Archive</p>
        <h1 className={styles.pageTitle}>Scrolls from the Realm</h1>
        <p className={styles.pageIntro}>
          Studies, histories, and accounts set down by maesters, septons, and
          scholars across the realm — preserved here for any who would learn
          from them.
        </p>
      </header>

      {categories.map((category) => {
        const scrollsInCategory = allScrolls.filter(
          (s) => s.category === category
        );
        if (scrollsInCategory.length === 0) return null;

        return (
          <section key={category} className={styles.categorySection}>
            <h2 className={styles.categoryTitle}>{category}</h2>
            <div className={styles.shelf}>
              {scrollsInCategory.map((scroll) => (
                <Link
                  key={scroll.id}
                  href={`/scrolls/${scroll.id}`}
                  className={styles.scrollCard}
                >
                  <div className={styles.scrollIcon} aria-hidden="true" />
                  <div className={styles.scrollCardText}>
                    <h3>{scroll.title}</h3>
                    <p className={styles.cardByline}>
                      {scroll.author}
                      {scroll.dateWritten && ` — ${scroll.dateWritten}`}
                    </p>
                    <p className={styles.cardSummary}>{scroll.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {allScrolls.length === 0 && (
        <p className={styles.empty}>
          No scrolls have been added to the archive yet.
        </p>
      )}
    </div>
  );
}
