"use client";

import Link from "next/link";
import Image from "next/image";
import UtilityIcon from "@/components/nav/UtilityIcon";
import type { HubData } from "@/lib/the-great-game/hub";
import PlayerTierGem from "./PlayerTierGem";
import styles from "./play-hub.module.css";

export type HubSection = "play" | "decks" | "ranks" | "social" | "store";

export default function HubNav({ active, data, guest, className }: { active: HubSection | null; data: HubData | null; guest: boolean; className?: string }) {
  return <nav className={`${styles.nav} ${className ?? ""}`} aria-label="The Great Game">
      <Link href="/cards/play" className={styles.brand} aria-label="The Great Game home"><UtilityIcon name="cards" size={28} /></Link>
      <div className={styles.navLinks}>
        <Link href="/cards/play" aria-current={active === "play" ? "page" : undefined}>Play</Link>
        <Link href="/cards/decks" aria-current={active === "decks" ? "page" : undefined}>Decks</Link>
        <Link href="/cards/ranks" aria-current={active === "ranks" ? "page" : undefined}>Ranks</Link>
        <Link href="/cards/social" aria-current={active === "social" ? "page" : undefined}>Social</Link>
        <Link href="/cards/store" aria-current={active === "store" ? "page" : undefined}>Store</Link>
      </div>
      <Link href={data ? `/users/${data.profile.username}` : "/login"} className={styles.profileChip} data-tier-gem-hover>
        <span className={styles.avatar}>{data?.profile.avatar_url ? <Image src={data.profile.avatar_url} alt="" width={38} height={38} unoptimized /> : <UtilityIcon name="cards" size={22} />}</span>
        <span><strong>{data?.profile.display_name || data?.profile.username || (guest ? "Take a seat" : "The Cupbearer")}</strong><small>{data?.ranking ? `Rank #${data.ranking.rank} · ${data.ranking.rating}` : guest ? "Sign in" : data ? "Unranked" : "Welcome, traveller"}</small></span>
        {data?.ranking ? <PlayerTierGem rating={data.ranking.rating} size="medium" className={styles.rankMark} /> : <span className={styles.rankMark} aria-hidden="true">♜</span>}
      </Link>
    </nav>;
}
