"use client";

import Link from "next/link";
import UtilityIcon from "@/components/nav/UtilityIcon";
import ContinueReadingLink from "@/components/reading/ContinueReadingLink";
import { useSpoilerBoundary } from "@/components/reading/ReadingProgressProvider";
import { getDragonAppearances } from "@/data/dragon-appearances";
import styles from "./dragonAppearances.module.css";

export default function DragonAppearances({ dragonId }: { dragonId: string }) {
  const { canReveal } = useSpoilerBoundary();
  const appearances = getDragonAppearances(dragonId);
  const visible = appearances.filter((appearance) => canReveal(appearance.chapterSlug));
  const hasLocked = visible.length < appearances.length;
  return <section className={styles.section} aria-labelledby="dragon-appearances-title">
    <div className={styles.header}><div><span>On the page</span><h2 id="dragon-appearances-title">Dragon Appearances</h2></div><p>Scenes through your reading boundary</p></div>
    <div className={styles.list}>
      {appearances.length === 0 && <p className={styles.empty}>No physical chapter appearances have been recorded yet.</p>}
      {visible.map((appearance, index) => <article className={styles.card} key={`${appearance.chapterSlug}-${appearance.label}-${index}`}>
        <div className={styles.marker} aria-hidden="true"><UtilityIcon name="dragon" size={19} /></div>
        <div className={styles.copy}><span>{appearance.chapterTitle}</span><h3>{appearance.label}</h3><p>{appearance.excerpt}</p></div>
        <Link href={`/chapters/${appearance.chapterSlug}`}>Read chapter <span aria-hidden="true">→</span></Link>
      </article>)}
      {hasLocked && <div className={styles.locked}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10M6 10h12v10H6z" /></svg><div><strong>Later appearances are sealed</strong><span>Continue reading to reveal further chapters and scenes.</span><ContinueReadingLink /></div></div>}
    </div>
  </section>;
}
