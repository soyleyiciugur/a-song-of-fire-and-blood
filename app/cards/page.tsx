"use client";

import { useState } from "react";
import { getTiers, getCardsByTier } from "@/lib/cards";
import { CharacterCard } from "@/components/cards/CharacterCard";
import Link from "next/link";
import styles from "./page.module.css";

export default function CardsPage() {
  const tiers = getTiers();
  const [activeTier, setActiveTier] = useState(tiers[0].id);

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h1>Character Tier List</h1>
        <Link href="/cards/duel" className={styles.duelLink}>
          ⚔️ Play Duel
        </Link>
      </div>

      <div className={styles.tabs}>
        {tiers.map((t) => (
          <button
            key={t.id}
            className={`${styles.tab} ${activeTier === t.id ? styles.activeTab : ""}`}
            style={{ borderColor: t.accentColor }}
            onClick={() => setActiveTier(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {getCardsByTier(activeTier).map((c) => (
          <CharacterCard key={c.id} card={c} />
        ))}
      </div>
    </div>
  );
}