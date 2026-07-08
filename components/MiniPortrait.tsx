"use client";

import { useState } from "react";
import Image from "next/image";

const FALLBACK = "/images/miniportraits/default.png";

type Props = {
  id: string;
  alt: string;
  size?: number;
};

export default function MiniPortrait({ id, alt, size = 36 }: Props) {
  const [src, setSrc] = useState(`/images/miniportraits/${id}.webp`);

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setSrc(FALLBACK)}
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
