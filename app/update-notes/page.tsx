import type { Metadata } from "next";
import Link from "next/link";
import notes from "@/data/update-notes.json";
import styles from "./updateNotes.module.css";

export const metadata: Metadata = {
  title: "Update Notes",
  description: "Daily updates, improvements and fixes to A Song of Fire and Blood.",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
});

export default function UpdateNotesPage() {
  const orderedNotes = [...notes].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.back}>&larr; Back to home</Link>
        <p className={styles.eyebrow}>The Site Record</p>
        <h1 className="realm-page-title">Update Notes</h1>
        <p className={styles.lead}>Daily improvements, new features and fixes.</p>
        <div className={styles.entries}>
          {orderedNotes.map((entry) => (
            <section key={entry.date} className={styles.entry} aria-labelledby={`date-${entry.date}`}>
              <h2 id={`date-${entry.date}`}>
                <time dateTime={entry.date}>{dateFormat.format(new Date(`${entry.date}T00:00:00Z`))}</time>
              </h2>
              <ul>{entry.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
