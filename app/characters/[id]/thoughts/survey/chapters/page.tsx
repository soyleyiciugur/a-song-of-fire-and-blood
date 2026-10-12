import { notFound } from "next/navigation";
import { getInnerCourtAccess } from "@/lib/inner-court-access";
import { getAllChapters } from "@/data/chapters";
import { chapterSurveyScope, getChapterSurveyQuestions } from "@/data/inner-court-chapter-surveys";
import ChapterSurveyIndex from "@/components/character/ChapterSurveyIndex";
import styles from "../../innerCourt.module.css";

export default async function ChapterSurveysPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { canEdit, supabase } = await getInnerCourtAccess(id);
  if (!canEdit || !["jacaelon-targaryen", "visenor-targaryen", "gaelor-targaryen", "hrrm"].includes(id)) notFound();
  const { data, error } = await supabase.from("inner_court_surveys").select("survey_version,answers,completed_at").eq("character_id", id);
  const chapters = getAllChapters().map((chapter) => {
    const questions = getChapterSurveyQuestions(id, chapter.slug);
    const progress = data?.find((row) => row.survey_version === chapterSurveyScope(chapter.slug));
    const answered = questions.filter((q) => progress?.answers[q.id]?.choices.length || progress?.answers[q.id]?.note.trim()).length;
    return { slug: chapter.slug, title: chapter.title, questions: questions.length, answered, completed: Boolean(progress?.completed_at), started: Boolean(progress) };
  });
  return <main className={`page ${styles.page}`}><div className={`container ${styles.shell}`}><ChapterSurveyIndex characterId={id} chapters={chapters} storageReady={!error}/></div></main>;
}
