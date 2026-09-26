"use client";

import PageTitleIcon from "@/components/nav/PageTitleIcon";
import Link from "next/link";
import {
  useState,
  useEffect,
  useCallback,
} from "react";

import tiersData from "@/data/cards/tiers.json";
import { getAllGameCards } from "@/lib/the-great-game/cards";

import { GameCardFace, GameCardModal } from "@/components/cards/GameCardFace";

import styles from "./page.module.css";

export default function CardsPage() {
  const tiers = [{ id: "all", label: "All Cards", order: -1, color: "#d4af37", accentColor: "#d4af37" }, ...tiersData].sort((a, b) => a.order - b.order);

  const [activeTier, setActiveTier] =
    useState(tiers[0].id);

  const [
    selectedCardId,
    setSelectedCardId,
  ] =
    useState<string | null>(null);

  const tierCards = getAllGameCards().filter((card) => activeTier === "all" || card.tierId === activeTier);

  const selectedIndex =
    tierCards.findIndex(
      (card) =>
        card.id ===
        selectedCardId
    );

  const handlePrev =
    useCallback(() => {
      if (selectedIndex > 0) {
        setSelectedCardId(
          tierCards[
            selectedIndex - 1
          ].id
        );
      }
    }, [
      selectedIndex,
      tierCards,
    ]);

  const handleNext =
    useCallback(() => {
      if (
        selectedIndex <
        tierCards.length - 1
      ) {
        setSelectedCardId(
          tierCards[
            selectedIndex + 1
          ].id
        );
      }
    }, [
      selectedIndex,
      tierCards,
    ]);

  useEffect(() => {
    if (!selectedCardId) {
      return;
    }

    function handleKey(
      event: KeyboardEvent
    ) {
      if (
        event.key === "ArrowLeft"
      ) {
        handlePrev();
      }

      if (
        event.key === "ArrowRight"
      ) {
        handleNext();
      }

      if (
        event.key === "Escape"
      ) {
        setSelectedCardId(null);
      }
    }

    window.addEventListener(
      "keydown",
      handleKey
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKey
      );
  }, [
    selectedCardId,
    handlePrev,
    handleNext,
  ]);

  function handleTierChange(
    tierId: string
  ) {
    setActiveTier(tierId);
    setSelectedCardId(null);
  }

  return (
    <div
      className={styles.wrapper}
    >
      <div
        className={
          styles.pageBackground
        }
        aria-hidden
      />

      {/* HEADER */}

      <div
        className={
          styles.headerRow
        }
      >
        <div
          className={
            styles.headerText
          }
        >
          <span
            className={
              styles.headerEyebrow
            }
          >
            The Realm&apos;s
            Reckoning
          </span>

          <h1
            className={
              styles.headerTitle
            }
          >
            The Great Game<PageTitleIcon name="cards" />
          </h1>
        </div>

        <nav
          className="greatGameNav greatGameNavPageCenter"
          aria-label="The Great Game"
        >
          <Link
            href="/cards"
            className="greatGameNavActive"
          >
            Cards
          </Link>

          <Link href="/cards/decks">
            Decks
          </Link>

          <Link href="/cards/play">
            Play
          </Link>
          <Link href="/cards/leaderboard">
            Ranks
          </Link>
        </nav>
      </div>

      {/* TIER TABS */}

      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Card tiers"
      >
        {tiers.map((tier) => (
          <button
            key={tier.id}
            type="button"
            role="tab"
            aria-selected={activeTier === tier.id}
            aria-controls="card-tier-panel"
            className={`${styles.tab} ${
              activeTier ===
              tier.id
                ? styles.activeTab
                : ""
            }`}
            style={
              activeTier ===
              tier.id
                ? {
                    borderColor:
                      tier.accentColor,

                    color:
                      tier.accentColor,
                  }
                : {
                    borderColor:
                      "rgba(255,255,255,0.2)",
                  }
            }
            onClick={() =>
              handleTierChange(
                tier.id
              )
            }
          >
            {tier.label}
          </button>
        ))}
      </div>

      {/* CARD GRID */}

      <div
        id="card-tier-panel"
        className={styles.grid}
        role="tabpanel"
      >
        {tierCards.map(
          (card) => (
            <GameCardFace
              key={card.id}
              card={card}
              onSelect={
                setSelectedCardId
              }
            />
          )
        )}
      </div>

      {/* MODAL */}

      {selectedCardId && selectedIndex >= 0 && <GameCardModal
        card={tierCards[selectedIndex]}
        onClose={() => setSelectedCardId(null)}
        onPrev={selectedIndex > 0 ? handlePrev : undefined}
        onNext={selectedIndex < tierCards.length - 1 ? handleNext : undefined}
      />}
    </div>
  );
}
