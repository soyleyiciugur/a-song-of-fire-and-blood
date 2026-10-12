"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSpoilerBoundary } from "@/components/reading/ReadingProgressProvider";
import ContinueReadingLink from "@/components/reading/ContinueReadingLink";
import { abstentions, type SurveyAnswer, type SurveyAnswers, type SurveyQuestion } from "@/data/inner-court-survey";
import type { InnerCourtSurveyRow } from "@/lib/supabase/database.types";
import { CourtCheck, PrivacyFields } from "./InnerCourtFields";
import styles from "@/app/characters/[id]/thoughts/innerCourt.module.css";

export default function InnerCourtSurvey({ characterId, questions, initial, chapterSlug, chapterTitle }: { characterId: string; questions: SurveyQuestion[]; initial: InnerCourtSurveyRow | null; chapterSlug?: string; chapterTitle?: string }) {
  const gm = characterId === "hrrm";
  const sections = useMemo(() => [...new Set(questions.map((q) => q.section))], [questions]);
  const [answers, setAnswers] = useState<SurveyAnswers>(initial?.answers ?? {});
  const [step, setStep] = useState(Math.min(initial?.step ?? 0, sections.length - 1));
  const [completed, setCompleted] = useState(Boolean(initial?.completed_at));
  const [showCompletion, setShowCompletion] = useState(Boolean(initial?.completed_at));
  const [status, setStatus] = useState(initial ? "Saved" : "Your answers will save automatically.");
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const revision = useRef(initial?.revision ?? 0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const dirty = useRef(false);
  const mounted = useRef(true);
  const questionStart = useRef<HTMLDivElement>(null);
  const completionCard = useRef<HTMLDivElement>(null);
  const scrollRequested = useRef(false);
  const { canReveal } = useSpoilerBoundary();
  const latest = useRef({ answers, step });
  useEffect(() => { latest.current = { answers, step }; }, [answers, step]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!scrollRequested.current) return;
    scrollRequested.current = false;
    const target = showCompletion ? completionCard.current : questionStart.current;
    target?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    target?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
  }, [step, showCompletion]);
  const persist = useCallback((snapshot: { answers: SurveyAnswers; step: number }, seal = false, complete = false) => {
    const task = queue.current.then(async () => {
      if (conflict) throw new Error("Reload this page to resolve the conflicting draft.");
      if (mounted.current) setStatus(seal ? "Sealing answered thoughts…" : "Saving…");
      const response = await fetch("/api/inner-court/survey", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ characterId, chapterSlug, ...snapshot, revision: revision.current, seal, complete }) });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409 && mounted.current) setConflict(true);
        throw new Error(result.error ?? "Could not save. Please retry.");
      }
      revision.current = result.revision;
      if (latest.current.answers === snapshot.answers && latest.current.step === snapshot.step) dirty.current = false;
      if (mounted.current) { setStatus(seal ? "Answered thoughts saved to Inner Court." : "Saved automatically"); setCompleted(Boolean(result.completedAt)); }
    });
    queue.current = task.catch((error: Error) => { if (mounted.current) setStatus(error.message); });
    return task;
  }, [characterId, chapterSlug, conflict]);
  useEffect(() => {
    if (!dirty.current || conflict) return;
    const timer = window.setTimeout(() => { void persist({ answers, step }).catch(() => {}); }, 700);
    return () => window.clearTimeout(timer);
  }, [answers, step, persist, conflict]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty.current) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  const empty = (): SurveyAnswer => ({ choices: [], note: "", private: gm, hideFromGm: false });
  function patch(id: string, change: Partial<SurveyAnswer>) {
    dirty.current = true; setStatus("Unsaved changes…");
    setAnswers((current) => ({ ...current, [id]: { ...(current[id] ?? empty()), ...change } }));
  }
  function navigate(next: number) { if (next === step) return; dirty.current = true; scrollRequested.current = true; setStep(next); }
  async function seal(complete: boolean) {
    setBusy(true);
    try { await persist({ answers, step }, true, complete); if (complete) { scrollRequested.current = true; setShowCompletion(true); } } catch { /* Retain editable draft and show the save error. */ }
    finally { setBusy(false); }
  }
  const answered = questions.filter((q) => answers[q.id]?.choices.length || answers[q.id]?.note.trim()).length;
  const chapterSurveysHref = `/characters/${characterId}/thoughts/survey/chapters`;
  if (showCompletion) return <div className={styles.survey} ref={completionCard}><section className={styles.surveyCompletion}><span className={styles.eyebrow}>{chapterTitle ?? "Unspoken Counsel"}</span><h2 tabIndex={-1}>Your counsel is recorded</h2><p>{chapterSlug ? "This chapter's answered thoughts have been saved to Inner Court." : "Your survey is complete. Continue with short surveys about the events of each chapter."}</p><Link className={styles.surveyCta} href={chapterSurveysHref}>See chapter-related surveys <span aria-hidden="true">→</span></Link><button type="button" onClick={() => { scrollRequested.current = true; setShowCompletion(false); }}>Revisit these answers</button><Link className={styles.back} href={`/characters/${characterId}/thoughts`}>Return to Inner Court</Link></section></div>;
  return <div className={styles.survey}>
    <header className={styles.surveyIntro}><span className={styles.eyebrow}>{chapterSlug ? "Chapter counsel" : gm ? "The GM's private counsel" : "The Inner Court"}</span><h1>{chapterTitle ?? "Unspoken Counsel"}</h1><p>{chapterSlug ? gm ? "A short working assessment of this chapter?s events and consequences. These entries do not establish player-owned beliefs." : "A few questions about the events of this chapter. Answer as your character thought and felt at that point in the story." : gm ? "A working record of your story and character assessments. These entries never alter a player's thoughts." : "Give voice to what your character carries within. Choose every answer that fits, or write your own."}</p><p>Autosave keeps a private draft. Save answered thoughts to transfer them to Inner Court; later saves update the same survey entries. Changes made directly to those entries will be replaced when you save those survey answers again.</p></header>
    <nav className={styles.surveySteps} aria-label="Survey steps">{sections.map((section, i) => <button type="button" aria-current={step === i ? "step" : undefined} disabled={busy} key={section} onClick={() => navigate(i)}><span>{i + 1}</span>{section}</button>)}</nav>
    <div className={styles.surveyProgress}><span>{answered} / {questions.length} answered</span><span role="status" aria-live="polite">{status}</span></div>
    {conflict && <p className={styles.saveMessage}>A newer draft exists in another tab. Copy any unsaved notes before reloading.</p>}
    <div className={styles.questionStart} ref={questionStart}>
    {questions.filter((q) => q.section === sections[step]).map((q) => {
      if (!gm && !canReveal(q.chapter)) return <div key={q.id} className={styles.locked}><div><h2 tabIndex={-1}>A later question remains sealed</h2><span>Continue reading to reach this question.</span><ContinueReadingLink /></div></div>;
      const answer = answers[q.id] ?? empty();
      return <section className={styles.surveyQuestion} key={q.id} aria-labelledby={`question-${q.id}`}><h2 id={`question-${q.id}`} tabIndex={-1}>{q.prompt}</h2><span className={styles.surveyHint}>Choose all that fit. A note alone is also an answer.</span><div className={styles.answerOptions}>{[...q.options, ...abstentions].map((choice) => <CourtCheck key={choice} checked={answer.choices.includes(choice)} disabled={busy || conflict} onChange={(checked) => {
        const choices = !checked ? answer.choices.filter((c) => c !== choice) : abstentions.includes(choice) ? [choice] : [...answer.choices.filter((c) => !abstentions.includes(c)), choice];
        patch(q.id, { choices });
      }}>{choice}</CourtCheck>)}</div><label className={styles.noteField}><span>The thought behind this…</span><textarea maxLength={3000} value={answer.note} disabled={busy || conflict} placeholder="Add nuance, contradict the options, or answer in your own words." onChange={(e) => patch(q.id, { note: e.target.value })}/></label><PrivacyFields disabled={busy || conflict} gm={gm} isPrivate={answer.private} hideFromGm={answer.hideFromGm} onChange={(isPrivate, hideFromGm) => patch(q.id, { private: isPrivate, hideFromGm })}/></section>;
    })}</div>
    <footer className={styles.surveyFooter}><div><button type="button" disabled={step === 0 || busy} onClick={() => navigate(step - 1)}>Previous</button>{step < sections.length - 1 && <button type="button" disabled={busy} onClick={() => navigate(step + 1)}>Next chapter of counsel →</button>}</div><div><button type="button" disabled={busy || conflict} onClick={() => void persist({ answers, step }).catch(() => {})}>Save draft</button><button type="button" disabled={busy || conflict || answered === 0} onClick={() => void seal(false)}>Save answered thoughts</button>{step === sections.length - 1 && <button type="button" className={styles.primaryButton} disabled={busy || conflict || answered !== questions.length} onClick={() => void seal(true)}>{completed ? "Update completed survey" : "Complete & seal survey"}</button>}</div></footer>
    <Link className={styles.back} href={`/characters/${characterId}/thoughts`} onClick={(e) => { if (dirty.current) { e.preventDefault(); setStatus("Save your draft before returning to Inner Court."); } }}>Return to Inner Court</Link>
  </div>;
}
