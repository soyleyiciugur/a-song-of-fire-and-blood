"use client";

import Link from "next/link";
import { useReadingProgress } from "./ReadingProgressProvider";
import styles from "./continueReadingLink.module.css";

export default function ContinueReadingLink({ className = "" }: { className?: string }) {
  const { progress } = useReadingProgress();
  const href = progress
    ? `/chapters/${progress.chapterSlug}?page=${progress.page}`
    : "/chapters";

  return (
    <Link className={`${styles.link} ${className}`.trim()} href={href}>
      Continue Reading
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4" /></svg>
    </Link>
  );
}
