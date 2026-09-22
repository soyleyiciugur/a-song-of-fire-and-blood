import ProfileGuestbook from "@/components/community/ProfileGuestbook";
import ProfileAffinity from "@/components/community/ProfileAffinity";
import { affinityCatalog } from "@/lib/profileAffinity";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth";
import SendRavenButton from "@/components/direct-raven/SendRavenButton";
import ProfileActivity from "@/components/community/ProfileActivity";
import ProfileFriends from "@/components/community/ProfileFriends";
import PlayedCharacterCard from "@/components/community/PlayedCharacterCard";
import styles from "./profile.module.css";

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase.from("profiles").select("*").eq("username", username.toLowerCase()).single();
  if (!p) notFound();

  const [{ count: threads }, { count: posts }, { count: raven }, { data: gameStats }, { data: deckStats }, { data: headToHead }, { data: matchHistory }, { data: leaderboardEntry }, viewer] = await Promise.all([
    supabase.from("forum_threads").select("*", { count: "exact", head: true }).eq("user_author_id", p.id).eq("is_visible", true),
    supabase.from("forum_posts").select("*", { count: "exact", head: true }).eq("user_author_id", p.id).eq("is_visible", true),
    supabase.from("raven_comments").select("*", { count: "exact", head: true }).eq("user_author_id", p.id).eq("is_visible", true),
    supabase.from("great_game_player_stats").select("*").eq("user_id", p.id).maybeSingle(),
    supabase.from("great_game_deck_stats").select("*").eq("user_id", p.id).order("games_played", { ascending: false }).limit(6),
    supabase.from("great_game_head_to_head").select("*").eq("user_id", p.id).order("games_played", { ascending: false }).limit(5),
    supabase.from("great_game_match_history").select("*").eq("user_id", p.id).order("completed_at", { ascending: false }).limit(8),
    supabase.from("great_game_leaderboard").select("*").eq("user_id", p.id).maybeSingle(),
    getCurrentUser(),
  ]);

  const viewerProfile=viewer?await getCurrentProfile():null;
  const isHrrm=p.username.toLowerCase()==="hrrm";
  const playedCharacterId=isHrrm?"hrrm":p.played_character_id;
  const rawHue=Number(p.affinity?.theme_hue??348),rawSat=Number(p.affinity?.theme_saturation??58),rawLight=Number(p.affinity?.theme_lightness??52);
  const customAccent=`hsl(${Math.min(360,Math.max(0,rawHue))} ${Math.min(100,Math.max(0,rawSat))}% ${Math.min(100,Math.max(0,rawLight))}%)`;
  return (
    <main className={styles.page} data-theme={p.profile_theme ?? "default"} style={p.profile_theme==="custom"?{"--profile-accent":customAccent,"--profile-glow":`hsl(${rawHue} ${rawSat}% ${rawLight}% / .22)`} as React.CSSProperties:undefined}>
      <div className={styles.banner}>{p.banner_url && <img src={p.banner_url} alt="" />}</div>
      <section className={styles.card}>
        <div className={styles.avatar}>{p.avatar_url ? <img src={p.avatar_url} alt="" /> : p.display_name.slice(0, 2).toUpperCase()}</div>
        <div>
          <p className={styles.handle}>@{p.username}{isHrrm && <span className={styles.gmTag}>GM</span>}</p>
          <h1>{p.display_name}</h1>
          {p.role !== "member" && <span className={styles.role}>{p.role}</span>}
          <p className={styles.joined}>Joined {new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(p.created_at))}</p>
          {p.bio && <p className={styles.bio}>{p.bio}</p>}
          <div className={styles.actions}>
            {viewer?.id === p.id ? <Link href="/settings">Edit profile</Link> : <SendRavenButton username={p.username} />}
          </div>
        </div>
      </section>
      <dl className={styles.stats}>
        <div><dt>Tavern Topics</dt><dd>{threads ?? 0}</dd></div>
        <div><dt>Tavern Talks</dt><dd>{posts ?? 0}</dd></div>
        <div><dt>Comments</dt><dd>{raven ?? 0}</dd></div>
      </dl>
      {gameStats && gameStats.games_played > 0 && (
        <section className={styles.gameRecord} aria-labelledby="great-game-record-heading">
          <div className={styles.sectionHeading}>
            <div><span>The Great Game</span><h2 id="great-game-record-heading">Match Record</h2></div>
            <Link href="/cards/play">Enter the table</Link>
          </div>
          <dl className={styles.gameStats}>
            <div><dt>Played</dt><dd>{gameStats.games_played}</dd></div>
            <div><dt>Wins</dt><dd>{gameStats.wins}</dd></div>
            <div><dt>Losses</dt><dd>{gameStats.losses}</dd></div>
            <div><dt>Abandons</dt><dd>{gameStats.abandons}</dd></div>
            <div><dt>Win Rate</dt><dd>{Number(gameStats.win_rate).toLocaleString("en-GB", { maximumFractionDigits: 1 })}%</dd></div>
            <div><dt>Win Streak</dt><dd>{gameStats.current_win_streak}</dd></div>
            <div><dt>Best Streak</dt><dd>{gameStats.longest_win_streak}</dd></div>
            <div><dt>Rating</dt><dd>{leaderboardEntry?.rating ?? 1000}</dd></div>
            <div><dt>Avg. Match</dt><dd>{Math.round(gameStats.average_duration_seconds / 60)}m</dd></div>
            <div><dt>Avg. Turns</dt><dd>{Number(gameStats.average_turns).toLocaleString("en-GB", { maximumFractionDigits: 1 })}</dd></div>
          </dl>
          {(deckStats?.length ?? 0) > 0 && <div className={styles.gameDetail}><h3>Deck &amp; Faction Record</h3>{deckStats!.map((deck, index) => <div className={styles.gameRow} key={`${deck.deck_name}:${deck.faction}`}><span><strong>{deck.deck_name}</strong><small>{index === 0 ? "Most used · " : ""}{deck.faction} · {deck.games_played} games</small></span><b>{deck.wins}W · {deck.losses}L · {deck.abandons}A</b></div>)}</div>}
          {(headToHead?.length ?? 0) > 0 && <div className={styles.gameDetail}><h3>Head to Head</h3>{headToHead!.map(record => <div className={styles.gameRow} key={record.opponent_id}><Link href={`/users/${record.opponent_username}`}>{record.opponent_display_name}</Link><b>{record.wins}W · {record.losses}L · {record.abandons}A</b></div>)}</div>}
          {(matchHistory?.length ?? 0) > 0 && <div className={styles.gameDetail}><h3>Recent Matches</h3>{matchHistory!.map(match => <div className={styles.gameRow} key={match.match_id}><span><strong className={styles[`result_${match.result}`]}>{match.result}</strong><small>vs. {match.opponent_display_name} · {match.deck_name} · {match.turns} turns</small></span><b>{match.rating_after - match.rating_before >= 0 ? "+" : ""}{match.rating_after - match.rating_before}</b></div>)}</div>}
        </section>
      )}
      {playedCharacterId && <PlayedCharacterCard characterId={playedCharacterId} isGameMaster={isHrrm} />}
      <ProfileFriends key={p.id} profileId={p.id} viewerId={viewer?.id ?? null} />
      <ProfileAffinity key={p.id} profileId={p.id} values={p.affinity??{}} catalog={affinityCatalog().map(field=>({...field,options:field.options.filter(option=>option.id===p.affinity?.[field.key]).map(option=>({ ...option, href: option.href.startsWith("/ravens-eye") ? `${option.href}${option.href.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(`/users/${p.username}`)}` : option.href }))}))} editable={false} />
      <ProfileGuestbook key={p.id} profileId={p.id} viewerId={viewer?.id??null} canModerate={viewerProfile?.role==="admin"||viewerProfile?.role==="moderator"} />
      <ProfileActivity key={p.id} userId={p.id} />
    </main>
  );
}
