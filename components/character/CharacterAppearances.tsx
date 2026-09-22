"use client";

import Link from "next/link";
import { timeline } from "@/data/timeline";
import { useSpoilerBoundary } from "@/components/reading/ReadingProgressProvider";
import type { Character } from "@/types/character";
import ContinueReadingLink from "@/components/reading/ContinueReadingLink";
import contentStyles from "./characterContent.module.css";
import styles from "./characterAppearances.module.css";

export default function CharacterAppearances({ character }: { character: Character }) {
  const { canReveal } = useSpoilerBoundary();
  const chapters = timeline
    .map((chapter) => ({
      ...chapter,
      scenes: chapter.events.filter((event) => event.characters?.includes(character.id)),
    }))
    .filter((chapter) => chapter.scenes.length > 0);

  const visible = chapters.filter((chapter) => canReveal(chapter.chapterSlug));
  const hasLocked = visible.length < chapters.length;

  return (
    <section className={contentStyles.sectionPanel}>
      <div className={contentStyles.sectionHeader}>
        <div className={contentStyles.sectionTitleGroup}>
          <span className={contentStyles.sectionEyebrow}>On the page</span>
          <h2 className={contentStyles.sectionTitle}>Character Appearances</h2>
        </div>
        <p className={contentStyles.sectionHint}>Scenes through your reading boundary</p>
      </div>

      <div className={styles.chapterList}>
        {chapters.length === 0 && (
          <p className={styles.empty}>No chapter appearances have been recorded yet.</p>
        )}
        {visible.map((chapter) => (
          <article className={styles.chapter} key={chapter.chapterSlug}>
            <div className={styles.chapterHeading}>
              <h3>{chapter.chapterTitle}</h3>
              <Link href={`/chapters/${chapter.chapterSlug}`}>Read chapter</Link>
            </div>
            <ul>
              {chapter.scenes.map((scene, index) => (
                <li key={`${scene.title}-${index}`}>
                  <span className={styles.marker} aria-hidden="true" />
                  <div>
                    <strong>{scene.title}</strong>
                    {scene.location && <span>{scene.location}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
        {hasLocked && (
          <div className={styles.locked} aria-label="Later character appearances are spoiler locked">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10M6 10h12v10H6z" /></svg>
            <div><strong>Later appearances are sealed</strong><span>Continue reading to reveal further chapters and scenes.</span><ContinueReadingLink /></div>
          </div>
        )}
      </div>
    </section>
  );
}
