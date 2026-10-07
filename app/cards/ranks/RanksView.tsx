"use client";

import Image from "next/image";
import Link from "next/link";
import HubNavFrame from "@/components/the-great-game/HubNavFrame";
import PlayerTierGem from "@/components/the-great-game/PlayerTierGem";
import { useHubData } from "@/components/the-great-game/useHubData";
import type { GreatGameLeaderboardRow } from "@/lib/supabase/database.types";
import styles from "./ranks.module.css";

function initials(player: GreatGameLeaderboardRow) {
  const value = player.display_name || player.username || "?";
  return value.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function PlayerAvatar({ player, large = false }: { player: GreatGameLeaderboardRow; large?: boolean }) {
  return <span className={`${styles.avatar} ${large ? styles.avatarLarge : ""}`}>
    {player.avatar_url ? <Image src={player.avatar_url} alt="" width={large ? 72 : 42} height={large ? 72 : 42} unoptimized /> : <span>{initials(player)}</span>}
  </span>;
}

export default function RanksView({ leaders }: { leaders: GreatGameLeaderboardRow[] }) {
  const { data, guest } = useHubData();
  const podium = leaders.slice(0, 3);

  return <main className={styles.page}>
    <div className={styles.backdrop} aria-hidden="true" />
    <HubNavFrame active="ranks" data={data} guest={guest} />

    <header className={styles.hero}>
      <div>
        <span className={styles.eyebrow}>The Cupbearer · Realm rankings</span>
        <h1>Ranks</h1>
      </div>
      <blockquote>“A title is wind. A record, however, can be checked.”<small>— Aldren</small></blockquote>
    </header>

    <section className={styles.content} aria-label="The Great Game rankings">
      <section className={styles.highTable} aria-labelledby="high-table-heading">
        <div className={styles.sectionHeading}><span>At the high table</span><small>Top rated Rulers</small></div>
        <h2 id="high-table-heading" className={styles.srOnly}>Top three ranked players</h2>
        {podium.length ? <div className={styles.podium}>
          {podium.map(player => <Link href={`/users/${player.username}`} className={styles.podiumCard} data-rank={player.rank} data-tier-gem-hover key={player.user_id}>
            <span className={styles.rank}>#{player.rank}</span>
            <PlayerTierGem rating={player.rating} size="large" className={styles.podiumTier} />
            <PlayerAvatar player={player} large />
            <strong>{player.display_name || player.username}</strong>
            <small>@{player.username}</small>
            <div className={styles.rating}><b>{player.rating}</b><span>rating</span></div>
            <div className={styles.podiumMeta}><span>{player.wins}W · {player.losses}L</span><span>{player.current_win_streak > 1 ? `${player.current_win_streak} streak` : `${player.win_rate}% wins`}</span></div>
          </Link>)}
        </div> : <p className={styles.empty}>The ranking ledger is still blank. The first rated match will put ink on the page.</p>}
      </section>

      <section className={styles.ledger} aria-labelledby="rank-ledger-heading">
        <div className={styles.sectionHeading}><span id="rank-ledger-heading">The ledger</span><small>{leaders.length ? `${leaders.length} ranked Rulers` : "No entries yet"}</small></div>
        <div className={styles.labels} aria-hidden="true"><span>Tier / Rank</span><span>Ruler</span><span>Rating</span><span>Record</span><span>Form</span></div>
        <div className={styles.rows}>
          {leaders.map(player => <Link href={`/users/${player.username}`} className={styles.row} data-tier-gem-hover key={player.user_id}>
            <span className={styles.rankCell}><PlayerTierGem rating={player.rating} size="small" /><b>#{player.rank}</b></span>
            <span className={styles.identity}><PlayerAvatar player={player} /><span><b>{player.display_name || player.username}</b><small>@{player.username}</small></span></span>
            <span className={styles.rowRating}><b>{player.rating}</b><small>peak {player.peak_rating}</small></span>
            <span className={styles.record}>{player.wins}W · {player.losses}L · {player.abandons}A<small>{player.win_rate}% win rate</small></span>
            <span className={styles.form}>{player.current_win_streak > 1 ? <><b>{player.current_win_streak}</b><small>win streak</small></> : <><b>—</b><small>steady</small></>}</span>
          </Link>)}
        </div>
      </section>
    </section>
  </main>;
}
