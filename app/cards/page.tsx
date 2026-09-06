"use client";

import Link from "next/link";
import {
  useState,
  useEffect,
  useCallback,
} from "react";

import {
  getTiers,
  getCardsByTier,
} from "@/lib/cards";

import { CharacterCard } from "@/components/cards/CharacterCard";
import { CardModal } from "@/components/cards/CardModal";

import styles from "./page.module.css";

export default function CardsPage() {
  const tiers = getTiers();

  const [activeTier, setActiveTier] =
    useState(tiers[0].id);

  const [
    selectedCardId,
    setSelectedCardId,
  ] =
    useState<string | null>(null);

  const tierCards =
    getCardsByTier(activeTier);

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
            The Great Game
          </h1>
        </div>

        <nav
          className="greatGameNav"
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
        </nav>
      </div>

      {/* TIER TABS */}

      <div
        className={styles.tabs}
      >
        {tiers.map((tier) => (
          <button
            key={tier.id}
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
        className={styles.grid}
      >
        {tierCards.map(
          (card) => (
            <CharacterCard
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

      {selectedCardId && (
        <div
          className={
            styles.overlay
          }
          onClick={() =>
            setSelectedCardId(
              null
            )
          }
        >
          <button
            className={
              styles.navArrow
            }
            onClick={(event) => {
              event.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous card"
            style={{
              visibility:
                selectedIndex > 0
                  ? "visible"
                  : "hidden",
            }}
          >
            ‹
          </button>

          <CardModal
            cardId={
              selectedCardId
            }
            onClose={() =>
              setSelectedCardId(
                null
              )
            }
            onSelectCard={
              setSelectedCardId
            }
          />

          <button
            className={
              styles.navArrow
            }
            onClick={(event) => {
              event.stopPropagation();
              handleNext();
            }}
            aria-label="Next card"
            style={{
              visibility:
                selectedIndex <
                tierCards.length -
                  1
                  ? "visible"
                  : "hidden",
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}