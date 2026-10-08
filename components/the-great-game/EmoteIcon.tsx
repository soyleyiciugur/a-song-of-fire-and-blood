import Image from "next/image";
import type { GreatGameEmoteId } from "@/lib/the-great-game/emotes";

/** Vendored Twemoji artwork and Lucide's four-point sparkle; see asset credits. */
export default function EmoteIcon({ id }: { id: GreatGameEmoteId }) {
  const src = `/images/cards/emotes/${id}.svg`;
  return <Image src={src} alt="" width={18} height={18} unoptimized loading="eager" draggable={false} style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }} />;
}
