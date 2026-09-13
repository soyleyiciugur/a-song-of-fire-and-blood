"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";

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

export default function MiniPortrait({ id, alt, size = 36, className, fallbackSrc, fallbackGlyph }: Props) {
  const [extensionIndex, setExtensionIndex] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  useEffect(() => {
    setExtensionIndex(0);
    setUsingFallback(false);
    setFallbackFailed(false);
  }, [id, fallbackSrc]);

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

  const resolvedFallback = fallbackSrc ?? (fallbackGlyph ? null : FALLBACK);
  const src = usingFallback && resolvedFallback
    ? resolvedFallback
    : `/images/miniportraits/${id}.${EXTENSIONS[extensionIndex]}`;

  return (
    <Image
      key={`${id}-${extensionIndex}-${usingFallback ? "fallback" : "portrait"}`}
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
        if (!usingFallback && resolvedFallback) {
          setUsingFallback(true);
          return;
        }
        setFallbackFailed(true);
      }}
      style={sharedStyle}
    />
  );
}
