"use client";

import { useState } from "react";

const FALLBACK = "/images/miniportraits/default.png";

type Props = {
  id: string;
  alt: string;
};

export default function MiniPortrait({ id, alt }: Props) {
  const [src, setSrc] = useState(`/images/miniportraits/${id}.webp`);

  return (
    <img
      src={src}
      alt={alt}
      width={36}
      height={36}
      loading="lazy"
      onError={() => setSrc(FALLBACK)}
      style={{
        borderRadius: 8,
        objectFit: "cover",
        border: "1px solid var(--border)",
        background: "var(--surface-hover)",
        flexShrink: 0,
      }}
    />
  );
}
