import { z } from "zod";
import { getInnerCourtAccess } from "@/lib/inner-court-access";
import { getSurveyQuestions, answerBody, abstentions } from "@/data/inner-court-survey";
import { getChapterSurveyQuestions, chapterSurveyScope } from "@/data/inner-court-chapter-surveys";

const schema = z.object({
  characterId: z.string().max(80), revision: z.number().int().min(0), step: z.number().int().min(0).max(20),
  seal: z.boolean(), complete: z.boolean(),
  chapterSlug: z.string().max(100).optional(),
  answers: z.record(z.string(), z.object({ choices: z.array(z.string().max(250)).max(12), note: z.string().max(3000), private: z.boolean(), hideFromGm: z.boolean() })),
});
export async function PUT(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid origin" }, { status: 403 });
  const raw = await request.text();
  if (raw.length > 150000) return Response.json({ error: "Draft too large" }, { status: 413 });
  let parsed;
  try { parsed = schema.safeParse(JSON.parse(raw)); } catch { return Response.json({ error: "Invalid draft" }, { status: 400 }); }
  if (!parsed.success) return Response.json({ error: "Invalid draft" }, { status: 400 });
  const input = parsed.data;
  const { supabase, canEdit } = await getInnerCourtAccess(input.characterId);
  if (!canEdit) return Response.json({ error: "Not permitted" }, { status: 403 });
  const questions = input.chapterSlug ? getChapterSurveyQuestions(input.characterId, input.chapterSlug) : getSurveyQuestions(input.characterId);
  if (!questions.length) return Response.json({ error: "Survey unavailable" }, { status: 404 });
  for (const [id, answer] of Object.entries(input.answers)) {
    const question = questions.find((q) => q.id === id);
    if (!question || answer.choices.some((c) => ![...question.options, ...abstentions].includes(c)) || (answer.hideFromGm && !answer.private) || (answer.choices.some((c) => abstentions.includes(c)) && answer.choices.length !== 1)) {
      return Response.json({ error: "Invalid answer" }, { status: 400 });
    }
  }
  if (input.complete && (!input.seal || questions.some((q) => !input.answers[q.id]?.choices.length && !input.answers[q.id]?.note.trim()))) return Response.json({ error: "Answer or explicitly skip each question before completing." }, { status: 400 });
  const sealed_entries = questions.filter((q) => input.answers[q.id]).map((q) => {
    const a = input.answers[q.id];
    return { key: q.id, chapter: q.chapter, kind: q.kind, subject: q.subject, characters: q.characters, body: answerBody(q, a), private: input.characterId === "hrrm" || a.private, hideFromGm: a.hideFromGm };
  });
  const { data, error } = await supabase.rpc("save_inner_court_survey", { target_character: input.characterId, version_key: chapterSurveyScope(input.chapterSlug), draft_answers: input.answers, draft_step: input.step, expected_revision: input.revision, seal: input.seal, complete: input.complete, sealed_entries });
  if (error) return Response.json({ error: error.code === "40001" ? "This survey changed in another tab. Reload before continuing." : "Could not save. Your answers remain on this page; retry before leaving." }, { status: error.code === "40001" ? 409 : 503 });
  return Response.json({ revision: data.revision, completedAt: data.completed_at, savedAt: data.updated_at }, { headers: { "Cache-Control": "private, no-store" } });
}
