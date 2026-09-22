"use client";

import { getAllChapters } from "@/data/chapters";
import { useReadingProgress } from "@/components/reading/ReadingProgressProvider";
import { Select } from "@/app/_components/Select";
import styles from "./settings.module.css";

export default function ReadingBoundarySettings() {
  const chapters = getAllChapters();
  const { progress, ready, setProgress } = useReadingProgress();
  const fallback = chapters.at(-1)?.slug ?? "";
  const value = progress?.chapterSlug ?? fallback;

  return <section className={styles.section} id="reading-progress">
    <h2 className={styles.sectionTitle}>Reading progress</h2>
    <p className={styles.sectionIntro}>Choose the last chapter you have read. Character details, relationships, appearances, events, Raven&apos;s Eye captions, Echoes and future spoiler-sensitive features use this shared boundary.</p>
    <label className={styles.field}>
      Last chapter read
      <Select
        value={value}
        options={chapters.map((chapter) => ({ id: chapter.slug, name: chapter.title }))}
        onChange={(chapterSlug) => void setProgress(chapterSlug, chapterSlug === progress?.chapterSlug ? progress.page : 0)}
      />
      <span className={styles.hint}>{ready ? "Saved to your account and this device." : "Loading your reading progress…"}</span>
    </label>
  </section>;
}
