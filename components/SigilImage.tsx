"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  size?: number;
  shape?: "circle" | "rounded";
  fallbackText?: string;
};

export default function SigilImage({
  src,
  alt,
  size = 96,
  shape = "circle",
  fallbackText,
}: Props) {
  const [failed, setFailed] = useState(false);

  const radius = shape === "circle" ? "50%" : "var(--radius-md)";

  if (failed) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--surface-hover)",
          border: "2px solid var(--border)",
          color: "var(--muted)",
          fontSize: size * 0.32,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {fallbackText ?? alt.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        borderRadius: radius,
        border: "2px solid var(--gold)",
        flexShrink: 0,
        background: "var(--surface)",
      }}
    />
  );
}
