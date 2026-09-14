"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import charactersData from "@/data/characters/characters.json";
import housesData from "@/data/houses.json";

const FALLBACK = "/images/miniportraits/default.webp";
const EXTENSIONS = ["webp", "png", "jpg", "jpeg"] as const;

type Props = {
  id: string;
  alt: string;
  size?: number;
  className?: string;
  fallbackSrc?: string;
  fallbackGlyph?: string;
};

type CharacterHouseRow = { id: string; house?: string };
type HouseRow = { id: string; name: string; sigilSrc?: string };

const CHARACTER_HOUSES = new Map(
  (charactersData as CharacterHouseRow[]).map((character) => [character.id, character.house ?? ""]),
);
const HOUSES = housesData as HouseRow[];

function automaticHouseFallback(characterId: string) {
  const characterHouse = CHARACTER_HOUSES.get(characterId)?.trim();
  if (!characterHouse || characterHouse === "-") return null;
  const normalized = characterHouse.replace(/^House\s+/i, "").trim().toLocaleLowerCase();
  const house = HOUSES.find((item) =>
    item.name.toLocaleLowerCase() === characterHouse.toLocaleLowerCase() ||
    item.id.toLocaleLowerCase() === normalized,
  );
  return house?.sigilSrc ?? (house ? `/images/houses/${house.id}.webp` : null);
}

export default function MiniPortrait({ id, alt, size = 36, className, fallbackSrc, fallbackGlyph }: Props) {
  const [extensionIndex, setExtensionIndex] = useState(0);
  const [fallbackIndex, setFallbackIndex] = useState(-1);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  const houseFallback = useMemo(() => automaticHouseFallback(id), [id]);
  const fallbackCandidates = useMemo(() => {
    const candidates: string[] = [];
    if (houseFallback) candidates.push(houseFallback);
    if (fallbackSrc) candidates.push(fallbackSrc);
    if (!fallbackGlyph) candidates.push(FALLBACK);
    return [...new Set(candidates)];
  }, [fallbackGlyph, fallbackSrc, houseFallback]);

  useEffect(() => {
    setExtensionIndex(0);
    setFallbackIndex(-1);
    setFallbackFailed(false);
  }, [id, fallbackSrc, houseFallback]);

  const portraitSize = `var(--mini-portrait-size, ${size}px)`;
  const sharedStyle: CSSProperties = {
    borderRadius: 8,
    objectFit: "cover",
    border: "1px solid var(--border)",
    width: portraitSize,
    height: portraitSize,
    background: "var(--surface-hover)",
    flexShrink: 0,
  };

  if (fallbackFailed && fallbackGlyph) {
    return (
      <span
        className={className}
        aria-label={`${alt} portrait unavailable`}
        role="img"
        style={{
          ...sharedStyle,
          display: "inline-grid",
          placeItems: "center",
          color: "var(--gold)",
          fontSize: `calc(${portraitSize} * .52)`,
          lineHeight: 1,
        }}
      >
        {fallbackGlyph}
      </span>
    );
  }

  const usingFallback = fallbackIndex >= 0;
  const usingHouseFallback = usingFallback && Boolean(houseFallback) && fallbackCandidates[fallbackIndex] === houseFallback;
  const src = usingFallback
    ? fallbackCandidates[fallbackIndex] ?? FALLBACK
    : `/images/miniportraits/${id}.${EXTENSIONS[extensionIndex]}`;

  return (
    <Image
      key={`${id}-${extensionIndex}-${fallbackIndex}-${src}`}
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className={className}
      onError={() => {
        if (!usingFallback && extensionIndex < EXTENSIONS.length - 1) {
          setExtensionIndex((current) => current + 1);
          return;
        }
        if (!usingFallback && fallbackCandidates.length) {
          setFallbackIndex(0);
          return;
        }
        if (usingFallback && fallbackIndex < fallbackCandidates.length - 1) {
          setFallbackIndex((current) => current + 1);
          return;
        }
        setFallbackFailed(true);
      }}
      style={{ ...sharedStyle, objectFit: usingHouseFallback ? "contain" : "cover", padding: usingHouseFallback ? 2 : undefined }}
    />
  );
}
