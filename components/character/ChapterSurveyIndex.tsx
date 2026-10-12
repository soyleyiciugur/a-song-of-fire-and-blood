"use client";

import Link from "next/link";
import { useSpoilerBoundary } from "@/components/reading/ReadingProgressProvider";
import ContinueReadingLink from "@/components/reading/ContinueReadingLink";
import styles from "@/app/characters/[id]/thoughts/innerCourt.module.css";

export type ChapterSurveySummary = { slug: string; title: string; questions: number; answered: number; completed: boolean; started: boolean };
export default function ChapterSurveyIndex({ characterId, chapters, storageReady }: { characterId: string; chapters: ChapterSurveySummary[]; storageReady: boolean }) {
  const { canReveal } = useSpoilerBoundary();
  return <div className={styles.survey}>
    <header className={styles.surveyIntro}><span className={styles.eyebrow}>The Inner Court</span><h1>Chapter Counsel</h1><p>{characterId === "hrrm" ? "Short GM assessments of each chapter?s events and consequences. Your private working notes will be filed under the relevant chapter." : "Short surveys for the events your character experienced or learned about. Revisit each chapter in order, or choose one to reflect on. Your thoughts will be filed under that chapter in Inner Court."}</p></header>
    {!storageReady && <p className={styles.saveMessage}>Saved progress is temporarily unavailable. Your existing answers have not been changed.</p>}
    <div className={styles.chapterSurveyList}>{chapters.map((chapter, index) => {
      if (characterId !== "hrrm" && !canReveal(chapter.slug)) return <article key={chapter.slug} className={styles.chapterSurveyCard}><span className={styles.eyebrow}>Chapter {index + 1}</span><h2>A later chapter remains sealed</h2><ContinueReadingLink /></article>;
      return <article key={chapter.slug} className={styles.chapterSurveyCard}><div><span className={styles.eyebrow}>{chapter.questions ? `${chapter.questions} questions · ${chapter.answered} answered` : "No questions for your character"}</span><h2>{chapter.title}</h2>{!chapter.questions && <p>No new character-known events are included for this chapter.</p>}</div>{chapter.questions > 0 && <div className={styles.chapterSurveyActions}>{chapter.completed && <span>Completed ✓</span>}<Link href={`/characters/${characterId}/thoughts/survey?chapter=${chapter.slug}`}>{chapter.completed ? "Revisit answers" : chapter.started ? "Continue survey" : "Begin chapter survey"}<span aria-hidden="true"> →</span></Link></div>}</article>;
    })}</div>
    <Link className={styles.back} href={`/characters/${characterId}/thoughts`}>Return to Inner Court</Link>
  </div>;
}
