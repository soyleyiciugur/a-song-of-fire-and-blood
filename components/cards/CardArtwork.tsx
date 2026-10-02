"use client";

import { createContext, useContext, useEffect, useState } from "react";
import artworkSettings from "@/data/the-great-game/artwork.json";
import { DEFAULT_ARTWORK, type ArtworkSettings } from "@/lib/the-great-game/artwork";
import type { GameCard } from "@/lib/the-great-game/types";
import { loadDeckFront } from "./useDeckFront";
import styles from "@/app/cards/play/play.module.css";

const extensions = ["webp", "png", "jpg", "jpeg"];
export const CardArtworkSettingsContext = createContext<Record<string, ArtworkSettings> | null>(null);
const loadedSources = new Map<string, Promise<boolean>>();
const artworkRequests = new Map<string, Promise<string | null>>();
const resolvedArtwork = new Map<string, string | null>();
let characterPortraits: Promise<Record<string, string>> | null = null;

function loadCharacterPortraits() {
  if (!characterPortraits) characterPortraits = fetch("/api/cards/portraits", { cache: "no-store" })
    .then(response => { if (!response.ok) throw new Error("Portraits unavailable"); return response.json() as Promise<Record<string, string>>; })
    .catch(error => { characterPortraits = null; throw error; });
  return characterPortraits;
}

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
      if (cardType === "character") {
        const portrait = (await loadCharacterPortraits())[portraitId];
        if (portrait && await preload(portrait)) return portrait;
      }
      const bases = cardType === "character"
        ? [`/images/characters/${portraitId}`]
        : [`/images/cards/${cardId}`];
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
    }).catch(error => {
      artworkRequests.delete(key);
      throw error;
    });
    artworkRequests.set(key, request);
  }
  return request;
}

export function CardArtwork({ card, className }: { card: GameCard; className?: string }) {
  const previewSettings = useContext(CardArtworkSettingsContext);
  const framing = (previewSettings ?? artworkSettings as Record<string, ArtworkSettings>)[card.id] ?? DEFAULT_ARTWORK;
  const portraitId = card.cardType === "character" ? card.linkedCharacterId ?? card.id : card.id;
  const key = `${card.cardType}:${card.id}:${portraitId}`;
  const [loaded, setLoaded] = useState<{ key: string; source: string | null } | null>(null);
  const source = loaded?.key === key ? loaded.source : resolvedArtwork.get(key);

  useEffect(() => {
    let active = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const load = (attempt = 0) => {
      resolveArtwork(key, card.id, card.cardType, portraitId).then(source => {
        if (active) setLoaded({ key, source });
      }).catch(() => {
        if (active && attempt < 2) retry = setTimeout(() => load(attempt + 1), 1000 * (attempt + 1));
      });
    };
    load();
    return () => { active = false; clearTimeout(retry); };
  }, [key, card.id, card.cardType, portraitId]);

  if (!source) return <div className={`${styles.artworkFallback} ${className ?? ""}`} aria-label={card.name} data-card-art="fallback"><span>✦</span></div>;

  return <img src={source} alt={card.name} className={className} draggable={false} data-card-art="loaded"
    style={{ objectPosition: `${framing.x}% ${framing.y}%`, transformOrigin: `${framing.x}% ${framing.y}%`, transform: `scale(${framing.zoom})` }}
    onError={() => { resolvedArtwork.set(key, null); artworkRequests.set(key, Promise.resolve(null)); setLoaded({ key, source: null }); }} />;
}
