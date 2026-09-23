"use client";

import { useState } from "react";
import Image from "next/image";
import MiniPortrait from "@/components/MiniPortrait";
import SigilImage from "@/components/SigilImage";
import UtilityIcon from "@/components/nav/UtilityIcon";
import type { SearchResult } from "@/lib/search";

type SearchVisualResult = Omit<SearchResult, "keywords">;

function LineIcon({ kind }: { kind: string }) {
  if (kind === "dragon" || kind === "quote") return <UtilityIcon name={kind} size={22} />;
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
      {kind === "chapter" && <><path d="M4 5.5c2.8-.9 5.3-.4 8 1.5v12c-2.7-1.9-5.2-2.4-8-1.5Z"/><path d="M20 5.5c-2.8-.9-5.3-.4-8 1.5v12c2.7-1.9 5.2-2.4 8-1.5Z"/></>}
      {kind === "update" && <><path d="M6 3h9l3 3v15H6Z"/><path d="M15 3v4h4M9 11h6M9 15h6"/><path d="m4 8 1-2 1 2 2 1-2 1-1 2-1-2-2-1Z"/></>}
      {kind === "feast" && <><path d="M7 4h10v4c0 4-2 6-5 6S7 12 7 8Z"/><path d="M12 14v5M9 20h6M4 6h3M17 6h3c0 3-1 4-3 4"/></>}
      {kind === "wedding" && <><circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/></>}
      {kind === "trial" && <><path d="M12 3v18M6 6h12M4 17h6l-3-6ZM14 17h6l-3-6ZM8 21h8"/></>}
      {kind === "battle" && <><path d="m5 4 14 15M19 4 5 19M4 3l3 1-3 3M20 3l-3 1 3 3"/></>}
      {kind === "tournament" && <><path d="M5 4h14v6c0 5-3 8-7 10-4-2-7-5-7-10Z"/><path d="m8 13 8-5"/></>}
      {kind === "event" && <><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></>}
    </g>
  </svg>;
}

function DragonPortrait({ item, size }: { item: SearchVisualResult; size: number }) {
  const [failed, setFailed] = useState(false);
  if (failed || !item.thumbnail || item.thumbnail.kind !== "dragon") return <LineIcon kind="dragon" />;
  return <Image src={item.thumbnail.src} alt="" width={size} height={size} unoptimized onError={() => setFailed(true)} />;
}

export default function SearchResultVisual({ item, size = 34 }: { item: SearchVisualResult; size?: number }) {
  if (item.type === "character") return <MiniPortrait id={item.id} alt="" size={size} />;
  if (item.type === "house" && item.thumbnail?.kind === "house") return <SigilImage src={item.thumbnail.src} alt="" size={size} shape="rounded" />;
  if (item.type === "dragon") return <DragonPortrait item={item} size={size} />;
  if (item.type === "gallery") return <UtilityIcon name="eye" size={22} />;
  if (item.type === "card" || (item.type === "page" && item.href === "/cards")) return <UtilityIcon name="cards" size={22} />;
  if (item.type === "quote") return <LineIcon kind="quote" />;
  if (item.type === "forum") return <UtilityIcon name="taverns" size={22} />;
  if (item.type === "update") return <LineIcon kind="update" />;
  if (item.type === "chapter") return <LineIcon kind="chapter" />;
  if (item.type === "event") return <LineIcon kind={item.iconVariant || "event"} />;
  return <span aria-hidden="true">{item.title.charAt(0)}</span>;
}
