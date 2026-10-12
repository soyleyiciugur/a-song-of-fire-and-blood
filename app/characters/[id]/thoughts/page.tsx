import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCharacter } from "@/lib/characters";
import { getCharacterPortraitVariants, resolveAvailablePortraitState } from "@/lib/characterPortraits";
import { computeAge, resolvePortraitAgeState } from "@/lib/age";
import worldDate from "@/data/worldDate.json";
import { getPlayedCharacterAssignment } from "@/data/character-inner-court";
import { getSurveyQuestions } from "@/data/inner-court-survey";
import { SURVEY_VERSION } from "@/data/inner-court-survey";
import InnerCourtContent from "@/components/character/InnerCourtContent";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import styles from "./innerCourt.module.css";

export default async function InnerCourtPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const character = getCharacter(id);
  const isGmCourt = id === "hrrm";
  const fallbackAssignment = getPlayedCharacterAssignment(id);
  const { data: storedAssignment } = await supabase.from("character_player_assignments").select("*").eq("character_id", id).maybeSingle();
  const playerUsername = storedAssignment?.player_username ?? fallbackAssignment?.playerUsername;
  if ((!character && !isGmCourt) || !playerUsername) notFound();
  const canEdit = Boolean(storedAssignment && profile?.username.toLowerCase() === storedAssignment.player_username.toLowerCase());
  if (isGmCourt && !canEdit) notFound();
  const { data: playerProfile } = await supabase.from("profiles").select("username").eq("username", playerUsername).maybeSingle();
  const { data: storedEntries } = await supabase.from("character_inner_court").select("*").eq("character_id", id).order("sort_order", { ascending: true }).order("created_at", { ascending: true });
  const entries = (storedEntries ?? []).map((entry) => ({
    id: entry.id, chapterSlug: entry.chapter_slug, kind: entry.kind,
    subject: entry.subject ?? undefined, body: entry.body, status: entry.status,
    supersedes: entry.supersedes ?? undefined, createdAt: entry.created_at, updatedAt: entry.updated_at, sortOrder: entry.sort_order,
    characterIds: entry.character_ids, isPrivate: entry.is_private, hideFromGm: entry.hide_from_gm, surveyKey: entry.survey_key ?? undefined,
  }));
  const { data: survey } = canEdit ? await supabase.from("inner_court_surveys").select("completed_at").eq("character_id", id).eq("survey_version", SURVEY_VERSION).maybeSingle() : { data: null };

  const age = character?.age ?? (character?.nameday ? computeAge(character.nameday, worldDate, character.death) : undefined);
  const variants = getCharacterPortraitVariants(id);
  const state = resolveAvailablePortraitState(resolvePortraitAgeState(age, character?.portraitAgeState), variants);
  const portrait = variants[state] ?? character?.portrait ?? "/images/characters/default.webp";

  return (
    <main className={`page ${styles.page}`}>
      <div className={`container ${styles.shell}`}>
        <Link className={styles.back} href={isGmCourt ? "/ledger" : `/characters/${id}`}>{isGmCourt ? "Back to My Ledger" : "Back to character profile"}</Link>
        <header className={styles.header}>
          <Image src={portrait} alt="" width={88} height={88} priority />
          <div>
            <span className={styles.eyebrow}>The Inner Court</span>
            <h1>{character?.name ?? "The GM's Counsel"}</h1>
            <p>Played by {playerProfile ? <Link href={`/users/${playerUsername}`}>@{playerUsername}</Link> : <b>@{playerUsername}</b>}</p>
          </div>
        </header>
        <p className={styles.intro}>{isGmCourt ? "Your private working record of the story, its characters and unfinished possibilities. These assessments do not establish player-owned beliefs." : "A chapter-bound record of the thoughts, doubts and convictions this character carries within. It belongs to the character and remains with them if their player changes."}</p>
        {canEdit && getSurveyQuestions(id).length > 0 && <aside className={styles.surveyInvitation}><div><span className={styles.eyebrow}>Unspoken Counsel</span><p>{survey?.completed_at ? "Your counsel has been recorded. You can return and revise your answers." : "A guided beginning for the thoughts you have yet to put into words."}</p></div>{survey?.completed_at ? <div className={styles.surveyCompleted}><button type="button" disabled>Survey completed ✓</button><Link href={`/characters/${id}/thoughts/survey`}>Revisit your answers</Link></div> : <Link className={styles.surveyCta} href={`/characters/${id}/thoughts/survey`}>Take the survey now <span aria-hidden="true">→</span></Link>}</aside>}
        <InnerCourtContent characterId={id} initialEntries={entries} canEdit={canEdit} userId={canEdit && profile ? profile.id : null} />
      </div>
    </main>
  );
}
