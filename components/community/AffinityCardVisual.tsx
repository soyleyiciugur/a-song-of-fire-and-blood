"use client";

import { useMemo, useState } from "react";

export default function AffinityCardVisual({ cardId, cardType, portrait }: { cardId:string; cardType?:string; portrait?:string }) {
  const candidates = useMemo(() => {
    const extensions = ["webp", "png", "jpg", "jpeg"];
    const paths = extensions.map((extension) => `/images/cards/${cardId}.${extension}`);
    if (cardType === "character") extensions.forEach((extension) => paths.push(`/images/characters/${portrait ?? cardId}.${extension}`));
    if (cardType === "dragon") extensions.forEach((extension) => paths.push(`/images/dragons/${cardId}.${extension}`));
    return paths;
  }, [cardId, cardType, portrait]);
  const [index, setIndex] = useState(0);
  if (index >= candidates.length) return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="m12 7 1.4 2.6L16 11l-2.6 1.4L12 15l-1.4-2.6L8 11l2.6-1.4Z"/></svg>;
  // Candidate probing intentionally uses a plain image so missing optional art
  // can advance through archive fallbacks without predeclaring every asset.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={candidates[index]} alt="" onError={() => setIndex((value) => value + 1)} />;
}
