import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import styles from "./leaderboard.module.css";

export default async function GreatGameLeaderboardPage() {
  const supabase = await createClient();
  const { data: leaders } = await supabase.from("great_game_leaderboard").select("*").order("rank").limit(100);
  return <main className={styles.page}>
    <header className={styles.header}>
      <p>The Realm&apos;s Reckoning</p><h1>Leaderboard</h1>
      <nav className="greatGameNav" aria-label="The Great Game"><Link href="/cards">Cards</Link><Link href="/cards/decks">Decks</Link><Link href="/cards/play">Play</Link><Link href="/cards/leaderboard" className="greatGameNavActive">Ranks</Link></nav>
    </header>
    <section className={styles.board} aria-label="Ranked players">
      <div className={styles.labels}><span>Rank</span><span>Claimant</span><span>Rating</span><span>Record</span><span>Streak</span></div>
      {(leaders ?? []).map(player => <Link className={styles.row} href={`/users/${player.username}`} key={player.user_id}>
        <strong>#{player.rank}</strong><span><b>{player.display_name}</b><small>@{player.username}</small></span><em>{player.rating}<small>Peak {player.peak_rating}</small></em><span>{player.wins}W · {player.losses}L · {player.abandons}A</span><span>{player.current_win_streak}</span>
      </Link>)}
      {(leaders?.length ?? 0) === 0 && <p className={styles.empty}>No ranked matches have been recorded yet.</p>}
    </section>
  </main>;
}
