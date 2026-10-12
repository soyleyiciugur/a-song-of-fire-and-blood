import type { InnerCourtEntry } from "@/data/character-inner-court";
import { getSurveyQuestions, SURVEY_VERSION } from "@/data/inner-court-survey";
import { getChapterSurveyQuestions, chapterSurveyScope } from "@/data/inner-court-chapter-surveys";

export function presentInnerCourtEntry(characterId: string, entry: InnerCourtEntry) {
  const questions = entry.surveyKey?.startsWith(`${SURVEY_VERSION}:`)
    ? getSurveyQuestions(characterId)
    : getChapterSurveyQuestions(characterId, entry.chapterSlug);
  const scope = entry.surveyKey?.startsWith(`${SURVEY_VERSION}:`) ? SURVEY_VERSION : chapterSurveyScope(entry.chapterSlug);
  const question = questions.find((question) => entry.surveyKey === `${scope}:${question.id}`);
  const selections: string[] = [];
  let body = entry.body;
  if (question) {
    // Read both the original paragraph format and newly sealed bullet lists.
    while (body) {
      const option = question.options.find((option) =>
        body === option || body.startsWith(`${option}\n\n`) ||
        body === `- ${option}` || body.startsWith(`- ${option}\n`));
      if (!option) break;
      selections.push(option);
      body = body.slice(option.length + (body.startsWith("- ") ? 2 : 0)).trimStart();
    }
  }
  const subject = question && (!entry.subject || entry.subject === question.legacySubject || entry.subject === question.subject)
    ? question.prompt : entry.subject;
  return { subject, selections, body };
}

// Negative positions explicitly mark an order saved by the owner. The legacy
// seed migration assigned non-negative positions even without a manual action.
export function hasManualInnerCourtOrder(entries: InnerCourtEntry[]) {
  return entries.some((entry) => {
    const position = entry.sortOrder ?? 0;
    if (position < 0) return true;
    // Previously saved orders used positive positions. Only the six original
    // seed rows received those positions automatically during setup.
    const seed = /^10000000-0000-4000-8000-00000000000([1-6])$/.exec(entry.id);
    return seed ? position !== (Number(seed[1]) - 1) % 2 : position > 0;
  });
}
