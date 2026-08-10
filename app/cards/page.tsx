"use client";

import { useState, useEffect, useCallback } from "react";
import { getTiers, getCardsByTier } from "@/lib/cards";
import { CharacterCard } from "@/components/cards/CharacterCard";
import { CardModal } from "@/components/cards/CardModal";
import styles from "./page.module.css";

export default function CardsPage() {
  const tiers = getTiers();
  const [activeTier, setActiveTier] = useState(tiers[0].id);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const tierCards = getCardsByTier(activeTier);
  const selectedIndex = tierCards.findIndex((c) => c.id === selectedCardId);

  const handlePrev = useCallback(() => {
    if (selectedIndex > 0) setSelectedCardId(tierCards[selectedIndex - 1].id);
  }, [selectedIndex, tierCards]);

  const handleNext = useCallback(() => {
    if (selectedIndex < tierCards.length - 1)
      setSelectedCardId(tierCards[selectedIndex + 1].id);
  }, [selectedIndex, tierCards]);

  useEffect(() => {
    if (!selectedCardId) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedCardId, handlePrev, handleNext]);

  function handleTierChange(tierId: string) {
    setActiveTier(tierId);
    setSelectedCardId(null);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageBackground} aria-hidden />

      <div className={styles.headerRow}>
        <div className={styles.headerText}>
          <span className={styles.headerEyebrow}>The Realm's Reckoning</span>
          <h1 className={styles.headerTitle}>The Great Game</h1>
        </div>
      </div>

      <div className={styles.tabs}>
        {tiers.map((t) => (
          <button
            key={t.id}
            className={`${styles.tab} ${activeTier === t.id ? styles.activeTab : ""}`}
            style={
              activeTier === t.id
                ? { borderColor: t.accentColor, color: t.accentColor }
                : { borderColor: "rgba(255,255,255,0.2)" }
            }
            onClick={() => handleTierChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {tierCards.map((c) => (
          <CharacterCard key={c.id} card={c} onSelect={setSelectedCardId} />
        ))}
      </div>

      {selectedCardId && (
        <div className={styles.overlay} onClick={() => setSelectedCardId(null)}>
          <button
            className={styles.navArrow}
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            aria-label="Previous card"
            style={{ visibility: selectedIndex > 0 ? "visible" : "hidden" }}
          >
            ‹
          </button>

          <CardModal
            cardId={selectedCardId}
            onClose={() => setSelectedCardId(null)}
            onSelectCard={setSelectedCardId}
          />

          <button
            className={styles.navArrow}
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            aria-label="Next card"
            style={{
              visibility: selectedIndex < tierCards.length - 1 ? "visible" : "hidden",
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}