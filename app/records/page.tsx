// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\records\page.tsx
import Link from "next/link";
import { getAllScrolls } from "@/lib/scrolls";
import { getAllKingsguardEntries } from "@/lib/bookOfBrothers";
import styles from "./records.module.css";

export const metadata = {
  title: "Records of the Realm",
};

export default function RecordsPage() {
  const scrollCount = getAllScrolls().length;
  const kingsguardCount = getAllKingsguardEntries().length;

  const sections = [
    {
      href: "/scrolls",
      title: "Scrolls from the Realm",
      description:
        "Studies, histories, and accounts set down by maesters, septons, and scholars across the realm.",
      count: scrollCount,
      countLabel: scrollCount === 1 ? "scroll" : "scrolls",
    },
    {
      href: "/book-of-brothers",
      title: "The Book of Brothers",
      description:
        "The record of every knight who has worn the white cloak — their vows, their years of service, and the deeds set down in their name.",
      count: kingsguardCount,
      countLabel: kingsguardCount === 1 ? "entry" : "entries",
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>The Citadel&apos;s Archive</p>
        <h1 className={styles.pageTitle}>Records of the Realm</h1>
        <p className={styles.pageIntro}>
          Every account, scroll, and ledger kept on House Targaryen and the
          realm it rules — gathered here for any who would learn from them.
        </p>
      </header>

      <div className={styles.shelf}>
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className={styles.recordCard}>
            <div className={styles.recordIcon} aria-hidden="true" />
            <div className={styles.recordCardText}>
              <h2>{section.title}</h2>
              <p className={styles.cardCount}>
                {section.count} {section.countLabel}
              </p>
              <p className={styles.cardSummary}>{section.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}