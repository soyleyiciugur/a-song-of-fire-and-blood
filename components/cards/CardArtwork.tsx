"use client";

import { useEffect, useState } from "react";
import type { GameCard } from "@/lib/the-great-game/types";
import { loadDeckFront } from "./useDeckFront";
import styles from "@/app/cards/play/play.module.css";

const extensions = ["webp", "png", "jpg", "jpeg"];
const loadedSources = new Map<string, Promise<boolean>>();
const artworkRequests = new Map<string, Promise<string | null>>();
const resolvedArtwork = new Map<string, string | null>();

function preload(source: string): Promise<boolean> {
  let request = loadedSources.get(source);
  if (!request) {
    request = new Promise<boolean>(resolve => {
      const image = new Image();
      image.onload = () => { image.decode().catch(() => {}).then(() => resolve(true)); };
      image.onerror = () => resolve(false);
      image.src = source;
    });
    loadedSources.set(source, request);
  }
  return request;
}

function resolveArtwork(key: string, cardId: string, cardType: GameCard["cardType"], portraitId: string) {
  let request = artworkRequests.get(key);
  if (!request) {
    request = (async () => {
      const bases = [`/images/cards/${cardId}`];
      if (cardType === "character") bases.push(`/images/characters/${portraitId}`);
      if (cardType === "dragon") bases.push(`/images/dragons/${cardId}`);
      for (const base of bases) {
        for (const extension of extensions) {
          const source = `${base}.${extension}`;
          if (await preload(source)) return source;
        }
      }
      const front = await loadDeckFront();
      return front && await preload(front) ? front : null;
    })().then(source => {
      resolvedArtwork.set(key, source);
      return source;
    });
    artworkRequests.set(key, request);
  }
  return request;
}

export function CardArtwork({ card, className }: { card: GameCard; className?: string }) {
  const portraitId = card.cardType === "character" ? card.linkedCharacterId ?? card.id : card.id;
  const key = `${card.cardType}:${card.id}:${portraitId}`;
  const [loaded, setLoaded] = useState<{ key: string; source: string | null } | null>(null);
  const source = loaded?.key === key ? loaded.source : resolvedArtwork.get(key);

  useEffect(() => {
    let active = true;
    resolveArtwork(key, card.id, card.cardType, portraitId).then(source => {
      if (active) setLoaded({ key, source });
    });
    return () => { active = false; };
  }, [key, card.id, card.cardType, portraitId]);

  if (!source) return <div className={`${styles.artworkFallback} ${className ?? ""}`} aria-label={card.name} data-card-art="fallback"><span>✦</span></div>;

  return <img src={source} alt={card.name} className={className} draggable={false} data-card-art="loaded"
    onError={() => { resolvedArtwork.set(key, null); artworkRequests.set(key, Promise.resolve(null)); setLoaded({ key, source: null }); }} />;
}
