"use client";

import { useState } from "react";
import { getTiers, getCardsByTier } from "@/lib/cards";
import { CharacterCard } from "@/components/cards/CharacterCard";
import { CardModal } from "@/components/cards/CardModal";
import styles from "./page.module.css";

export default function CardsPage() {
  const tiers = getTiers();
  const [activeTier, setActiveTier] = useState(tiers[0].id);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageBackground} aria-hidden />

      <div className={styles.headerRow}>
        <div className={styles.headerText}>
          <span className={styles.headerEyebrow}>The Realm's Reckoning</span>
          <h1 className={styles.headerTitle}>Character Tier List</h1>
        </div>
      </div>

      <div className={styles.tabs}>
        {tiers.map((t) => (
          <button
            key={t.id}
            className={`${styles.tab} ${activeTier === t.id ? styles.activeTab : ""}`}
            style={activeTier === t.id ? { borderColor: t.accentColor, color: t.accentColor } : { borderColor: "rgba(255,255,255,0.2)" }}
            onClick={() => setActiveTier(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {getCardsByTier(activeTier).map((c) => (
          <CharacterCard key={c.id} card={c} onSelect={setSelectedCardId} />
        ))}
      </div>

      {selectedCardId && (
        <CardModal
          cardId={selectedCardId}
          onClose={() => setSelectedCardId(null)}
          onSelectCard={setSelectedCardId}
        />
      )}
    </div>
  );
}