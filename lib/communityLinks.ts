import gallery from "@/data/gallery.json";
import type { GutterComment } from "./communityTypes";

export function getCommentLink(comment: Pick<GutterComment, "id" | "entryId">) {
  const entry = gallery.find((item) => item.id === comment.entryId);
  if (!entry) return "/ravens-eye";
  const base = /\.(mp4|webm|mov)$/i.test(entry.src.split(/[?#]/)[0]) ? "/ravens-eye/reels" : entry.category === "fleabottom" ? "/ravens-eye/memes" : "/ravens-eye";
  const params = new URLSearchParams({ item: entry.id, comment: comment.id });
  return `${base}?${params}#comment-${encodeURIComponent(comment.id)}`;
}

export function getCommentEntryLabel(entryId: string) {
  const entry = gallery.find((item) => item.id === entryId);
  return entry?.caption?.trim().split("\n")[0].slice(0, 130) || "From the Raven's Eye";
}
