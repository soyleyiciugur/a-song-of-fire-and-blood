import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCharacter } from "@/lib/characters";
import { getCharacterPortraitVariants, resolveAvailablePortraitState } from "@/lib/characterPortraits";
import { computeAge, resolvePortraitAgeState } from "@/lib/age";
import worldDate from "@/data/worldDate.json";
import { getInnerCourtEntries, getPlayedCharacterAssignment } from "@/data/character-inner-court";
import InnerCourtContent from "@/components/character/InnerCourtContent";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import styles from "./innerCourt.module.css";

export default async function InnerCourtPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const character = getCharacter(id);
  const fallbackAssignment = getPlayedCharacterAssignment(id);
  const { data: storedAssignment } = await supabase.from("character_player_assignments").select("*").eq("character_id", id).maybeSingle();
  const playerUsername = storedAssignment?.player_username ?? fallbackAssignment?.playerUsername;
  if (!character || !playerUsername) notFound();
  const { data: playerProfile } = await supabase.from("profiles").select("username").eq("username", playerUsername).maybeSingle();
  const { data: storedEntries } = await supabase.from("character_inner_court").select("*").eq("character_id", id).order("sort_order", { ascending: true }).order("created_at", { ascending: true });
  const entries = storedEntries?.length ? storedEntries.map((entry) => ({
    id: entry.id, chapterSlug: entry.chapter_slug, kind: entry.kind,
    subject: entry.subject ?? undefined, body: entry.body, status: entry.status,
    supersedes: entry.supersedes ?? undefined, createdAt: entry.created_at, updatedAt: entry.updated_at, sortOrder: entry.sort_order,
  })) : getInnerCourtEntries(id);
  const canEdit = profile?.username.toLowerCase() === playerUsername.toLowerCase();

  const age = character.age ?? (character.nameday ? computeAge(character.nameday, worldDate, character.death) : undefined);
  const variants = getCharacterPortraitVariants(id);
  const state = resolveAvailablePortraitState(resolvePortraitAgeState(age, character.portraitAgeState), variants);
  const portrait = variants[state] ?? character.portrait ?? "/images/characters/default.webp";

  return (
    <main className={`page ${styles.page}`}>
      <div className={`container ${styles.shell}`}>
        <Link className={styles.back} href={`/characters/${id}`}>Back to character profile</Link>
        <header className={styles.header}>
          <Image src={portrait} alt="" width={88} height={88} priority />
          <div>
            <span className={styles.eyebrow}>The Inner Court</span>
            <h1>{character.name}</h1>
            <p>Played by {playerProfile ? <Link href={`/users/${playerUsername}`}>@{playerUsername}</Link> : <b>@{playerUsername}</b>}</p>
          </div>
        </header>
        <p className={styles.intro}>A chapter-bound record of the thoughts, doubts and convictions this character carries within. It belongs to the character and remains with them if their player changes.</p>
        <InnerCourtContent characterId={id} initialEntries={entries} canEdit={canEdit} userId={canEdit && profile ? profile.id : null} />
      </div>
    </main>
  );
}
