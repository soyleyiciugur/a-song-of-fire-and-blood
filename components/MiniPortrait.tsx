"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const FALLBACK = "/images/miniportraits/default.png";
const EXTENSIONS = ["webp", "png", "jpg", "jpeg"] as const;

type Props = {
  id: string;
  alt: string;
  size?: number;
  className?: string;
};

export default function MiniPortrait({ id, alt, size = 36, className }: Props) {
  const [extensionIndex, setExtensionIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setExtensionIndex(0);
    setFailed(false);
  }, [id]);

  const src = failed
    ? FALLBACK
    : `/images/miniportraits/${id}.${EXTENSIONS[extensionIndex]}`;

  return (
    <Image
      key={`${id}-${extensionIndex}-${failed ? "fallback" : "portrait"}`}
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className={className}
      onError={() => {
        if (!failed && extensionIndex < EXTENSIONS.length - 1) {
          setExtensionIndex((current) => current + 1);
          return;
        }
        setFailed(true);
      }}
      style={{
        borderRadius: 8,
        objectFit: "cover",
        border: "1px solid var(--border)",
        width: size,
        height: size,
        background: "var(--surface-hover)",
        flexShrink: 0,
      }}
    />
  );
}
