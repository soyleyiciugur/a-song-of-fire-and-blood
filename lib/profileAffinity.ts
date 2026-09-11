import "server-only";
import { createHash } from "node:crypto";
import characters from "@/data/characters/characters.json";
import chapters from "@/data/chapters.json";
import quotes from "@/data/quotes.json";
import gallery from "@/data/gallery.json";
import houses from "@/data/houses.json";
import dragons from "@/data/dragons.json";

export type AffinityOption = {
  id: string;
  title: string;
  href: string;
  image?: string;
  portrait?: string;
  mediaSrc?: string;
  mediaType?: "image" | "video";
};
export type AffinityField = { key: string; label: string; options: AffinityOption[] };

const isVideo = (src = "") => /\.(mp4|webm|mov)$/i.test(src);

export function affinityCatalog(): AffinityField[] {
  const fleaBottom = gallery
    .filter((g) => g.category === "fleabottom")
    .map((g) => ({
      id: g.id,
      title: g.caption || g.id,
      href: `${isVideo(g.src ?? "") ? "/ravens-eye/reels" : "/ravens-eye/memes"}?item=${encodeURIComponent(g.id)}`,
      image: isVideo(g.src ?? "") ? undefined : g.src ?? undefined,
      mediaSrc: g.src ?? undefined,
      mediaType: isVideo(g.src ?? "") ? ("video" as const) : ("image" as const),
    }));

  const ravenImages = gallery
    .filter((g) => g.category !== "fleabottom" && !isVideo(g.src ?? ""))
    .map((g) => ({
      id: g.id,
      title: g.caption || g.id,
      href: `/ravens-eye?item=${encodeURIComponent(g.id)}`,
      image: g.src ?? undefined,
      mediaSrc: g.src ?? undefined,
      mediaType: "image" as const,
    }));

  const fields: AffinityField[] = [
    {
      key: "character",
      label: "Favorite Character",
      options: characters
        .filter((c) => !("hidden" in c && c.hidden))
        .map((c) => ({ id: c.id, title: c.name, href: `/characters/${c.id}`, portrait: c.id })),
    },
    {
      key: "house",
      label: "Favorite House",
      options: houses.map((h) => ({ id: h.id, title: h.name, href: `/houses/${h.id}`, image: h.sigilSrc })),
    },
    {
      key: "dragon",
      label: "Favorite Dragon",
      options: dragons.map((d) => ({ id: d.id, title: d.name, href: `/dragons/${d.id}`, image: d.image })),
    },
    {
      key: "chapter",
      label: "Favorite Chapter",
      options: chapters.map((c) => ({ id: c.slug, title: c.title, href: `/chapters/${c.slug}`, image: c.image })),
    },
    {
      key: "quote",
      label: "Favorite Quote",
      options: quotes.map((q) => ({
        id: createHash("sha256").update(`${q.speakerId}\n${q.chapterSlug}\n${q.text}`).digest("hex").slice(0, 24),
        title: `${q.text} — ${q.speakerName}`,
        href: q.chapterSlug ? `/chapters/${q.chapterSlug}` : "/quotes",
        portrait: q.speakerId ?? undefined,
      })),
    },
    { key: "meme", label: "Favorite Meme", options: fleaBottom },
    { key: "image", label: "Favorite Image", options: ravenImages },
  ];

  return fields.map((field) => ({
    ...field,
    options: [...new Map(field.options.map((option) => [option.id, option])).values()],
  }));
}
