import type { Metadata } from "next";
import Link from "next/link";
import UpdateNotesContent from './UpdateNotesContent';
import styles from "./updateNotes.module.css";

export const metadata: Metadata = {
  title: "Update Notes",
  description: "Daily updates, improvements and fixes to A Song of Fire and Blood.",
};

export default function UpdateNotesPage() {

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.back}>&larr; Back to home</Link>
        <p className={styles.eyebrow}>The Site Record</p>
        <h1 className="realm-page-title">Update Notes</h1>
        <p className={styles.lead}>Daily improvements, new features and fixes.</p>
        <UpdateNotesContent />
      </div>
    </main>
  );
}
