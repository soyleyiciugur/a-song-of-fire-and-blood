import { notFound } from "next/navigation";
import { getInnerCourtAccess } from "@/lib/inner-court-access";
import { getSurveyQuestions } from "@/data/inner-court-survey";
import { getChapterSurveyQuestions, chapterSurveyScope } from "@/data/inner-court-chapter-surveys";
import { getAllChapters } from "@/data/chapters";
import InnerCourtSurvey from "@/components/character/InnerCourtSurvey";
import styles from "../innerCourt.module.css";

export default async function SurveyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ chapter?: string }> }) {
  const { id } = await params;
  const { canEdit, supabase } = await getInnerCourtAccess(id);
  if (!canEdit) notFound();
  const { chapter: chapterSlug } = await searchParams;
  const questions = chapterSlug ? getChapterSurveyQuestions(id, chapterSlug) : getSurveyQuestions(id);
  if (!questions.length) notFound();
  const { data, error } = await supabase.from("inner_court_surveys").select("*").eq("character_id", id).eq("survey_version", chapterSurveyScope(chapterSlug)).maybeSingle();
  if (error) return <main className={`page ${styles.page}`}><div className={`container ${styles.shell}`}><p>The survey is temporarily unavailable. Please try again after its storage update is ready.</p></div></main>;
  return <main className={`page ${styles.page}`}><div className={`container ${styles.shell}`}><InnerCourtSurvey key={chapterSurveyScope(chapterSlug)} characterId={id} questions={questions} initial={data} chapterSlug={chapterSlug} chapterTitle={getAllChapters().find((c) => c.slug === chapterSlug)?.title}/></div></main>;
}
