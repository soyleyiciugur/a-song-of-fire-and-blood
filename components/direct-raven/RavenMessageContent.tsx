"use client";

import Link from "next/link";
import MiniPortrait from "@/components/MiniPortrait";
import charactersData from "@/data/characters/characters.json";
import galleryData from "@/data/gallery.json";
import styles from "./direct-raven.module.css";

const PORTRAIT_TOKEN = /\[\[portrait:([a-z0-9-]+)\]\]/gi;
const CONTENT_TOKEN = /(\[\[(?:portrait|reel|media):[a-z0-9-]+\]\]|\[\[page:[A-Za-z0-9_-]+\]\])/gi;

type CharacterRecord = {
  id: string;
  name: string;
};

type GalleryRecord = {
  id: string;
  src: string;
  caption?: string | null;
};

const characterNames = new Map([
  ...(charactersData as CharacterRecord[]).map((character) => [character.id, character.name] as const),
  ["mara", "Mara"] as const,
  ["aldren", "Aldren"] as const,
]);

const reelMap = new Map(
  (galleryData as GalleryRecord[]).map((entry) => [entry.id, entry] as const)
);

const mascotFallback: Record<string, string> = {
  mara: "/images/miniportraits/MaraMiniPortrait.webp",
  aldren: "/images/miniportraits/AldrenMiniPortrait.webp",
};


function decodePageToken(payload: string): { title: string; href: string; description: string } | null {
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as { title?: unknown; href?: unknown; description?: unknown };
    if (typeof parsed.title !== "string" || typeof parsed.href !== "string" || !parsed.href.startsWith("/")) return null;
    return { title: parsed.title.slice(0, 180), href: parsed.href.slice(0, 1200), description: typeof parsed.description === "string" ? parsed.description.slice(0, 280) : "" };
  } catch {
    return null;
  }
}

function PageGlyph() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h8l4 4V20H6V3.5Z" fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M14 3.8V8h4M9 12h6M9 15.5h4.5" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/></svg>;
}

function reelPosterSrc(src: string) {
  const clean = src.split("?")[0].split("#")[0];
  const filename = clean.split("/").pop() ?? "reel";
  const base = filename.replace(/\.[^.]+$/, "");
  return `/videos/reels/posters/${encodeURIComponent(base)}.webp`;
}

function reelSummary(id: string) {
  const entry = reelMap.get(id);
  if (!entry) return "Gutter Reel";
  const caption = entry.caption?.trim();
  return caption ? `Gutter Reel · ${caption}` : "Gutter Reel";
}

function mediaSummary(id: string) {
  const entry = reelMap.get(id);
  if (!entry) return "Raven's Eye image";
  const caption = entry.caption?.trim();
  return caption ? `Raven's Eye · ${caption}` : "Raven's Eye image";
}

export function parseRavenBody(value: string, preserveWhitespace = false) {
  const portraitIds: string[] = [];
  const normalized = value
    .replace(PORTRAIT_TOKEN, (_match, id: string) => {
      portraitIds.push(id.toLowerCase());
      return "";
    })
    .replace(/\n{3,}/g, "\n\n");
  const text = preserveWhitespace
    ? normalized.replace(/\n[ \t]*$/, "")
    : normalized.trim();

  return { text, portraitIds };
}

export function encodeRavenBody(text: string, portraitIds: string[], preserveWhitespace = false) {
  const cleanText = preserveWhitespace ? text.replace(/\n{3,}/g, "\n\n") : text.trim();
  const tokens = portraitIds.map((id) => `[[portrait:${id}]]`).join(" ");
  return [cleanText, tokens].filter(Boolean).join("\n");
}

export function ravenBodySummary(value: string) {
  const reelMatch = /\[\[reel:([a-z0-9-]+)\]\]/i.exec(value);
  const mediaMatch = /\[\[media:([a-z0-9-]+)\]\]/i.exec(value);
  const pageMatch = /\[\[page:([A-Za-z0-9_-]+)\]\]/i.exec(value);
  const visibleText = value
    .replace(CONTENT_TOKEN, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (visibleText) return visibleText;
  if (reelMatch) return reelSummary(reelMatch[1].toLowerCase());
  if (mediaMatch) return mediaSummary(mediaMatch[1].toLowerCase());
  if (pageMatch) {
    const page = decodePageToken(pageMatch[1]);
    return page ? `Shared page · ${page.title}` : "Shared page";
  }

  const { text, portraitIds } = parseRavenBody(value);
  if (text) return text;
  if (portraitIds.length === 1) return "Mini portrait";
  if (portraitIds.length > 1) return `${portraitIds.length} mini portraits`;
  return "Raven";
}

export function RavenMessagePreview({ body }: { body: string }) {
  const sharedPageMatch = /\[\[page:([A-Za-z0-9_-]+)\]\]/i.exec(body);
  if (sharedPageMatch) {
    const page = decodePageToken(sharedPageMatch[1]);
    const message = body.replace(sharedPageMatch[0], " ").replace(/\s+/g, " ").trim();
    return <>{message ? <>{message} · </> : null}<span className={styles.previewPageName}>{page?.title || "Shared page"}</span></>;
  }

  return <>{body.split(CONTENT_TOKEN).map((part, index) => {
    const portraitMatch = /^\[\[portrait:([a-z0-9-]+)\]\]$/i.exec(part);
    if (portraitMatch && characterNames.has(portraitMatch[1].toLowerCase())) {
      const id = portraitMatch[1].toLowerCase();
      return <span key={index} className={styles.previewPortrait} title={characterNames.get(id)}><MiniPortrait id={id} alt="" size={18} fallbackSrc={mascotFallback[id]} /></span>;
    }

    const reelMatch = /^\[\[reel:([a-z0-9-]+)\]\]$/i.exec(part);
    if (reelMatch) {
      const entry = reelMap.get(reelMatch[1].toLowerCase());
      return <span key={index}><span className={styles.previewReel}>Reel</span>{entry?.caption?.trim() ? ` ${entry.caption.trim()}` : ""}</span>;
    }

    const mediaMatch = /^\[\[media:([a-z0-9-]+)\]\]$/i.exec(part);
    if (mediaMatch) {
      const entry = reelMap.get(mediaMatch[1].toLowerCase());
      return <span key={index}><span className={styles.previewReel}>Image</span>{entry?.caption?.trim() ? ` ${entry.caption.trim()}` : ""}</span>;
    }

    return part;
  })}</>;
}

export default function RavenMessageContent({ body, returnTo }: { body: string; returnTo?: string }) {
  return <p>{body.split(CONTENT_TOKEN).map((part, index) => {
    const portraitMatch = /^\[\[portrait:([a-z0-9-]+)\]\]$/i.exec(part);
    if (portraitMatch && characterNames.has(portraitMatch[1].toLowerCase())) {
      const id = portraitMatch[1].toLowerCase();
      return <span key={index} className={styles.inlinePortrait} title={characterNames.get(id)}><MiniPortrait id={id} alt={characterNames.get(id)!} size={28} fallbackSrc={mascotFallback[id]} /></span>;
    }

    const pageMatch = /^\[\[page:([A-Za-z0-9_-]+)\]\]$/i.exec(part);
    if (pageMatch) {
      const page = decodePageToken(pageMatch[1]);
      if (!page) return <span key={index}>Shared page</span>;
      return (
        <Link key={index} href={page.href} className={styles.sharedPageCard}>
          <span className={styles.sharedPageIcon}><PageGlyph /></span>
          <span className={styles.sharedReelCopy}>
            <small>Shared page</small>
            <strong>{page.title}</strong>
            {page.description && <span className={styles.sharedPageDescription}>{page.description}</span>}
            <em>Open page</em>
          </span>
        </Link>
      );
    }

    const reelMatch = /^\[\[reel:([a-z0-9-]+)\]\]$/i.exec(part);
    if (reelMatch) {
      const id = reelMatch[1].toLowerCase();
      const entry = reelMap.get(id);
      if (!entry) return <span key={index}>Shared Gutter Reel</span>;
      return (
        <Link
          key={index}
          href={`/ravens-eye/reels?item=${encodeURIComponent(id)}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`}
          className={styles.sharedReelCard}
        >
          <span className={styles.sharedReelPoster}>
            <img src={reelPosterSrc(entry.src)} alt="" loading="lazy" decoding="async" />
            <span className={styles.sharedReelPlay} aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M9 6.7v10.6L17.5 12 9 6.7Z" fill="currentColor" /></svg>
            </span>
          </span>
          <span className={styles.sharedReelCopy}>
            <small>Gutter Reel</small>
            <strong>{entry.caption?.trim() || "A reel from Flea Bottom"}</strong>
            <em>Open in Raven&apos;s Eye</em>
          </span>
        </Link>
      );
    }

    const mediaMatch = /^\[\[media:([a-z0-9-]+)\]\]$/i.exec(part);
    if (mediaMatch) {
      const id = mediaMatch[1].toLowerCase();
      const entry = reelMap.get(id);
      if (!entry) return <span key={index}>Shared Raven&apos;s Eye image</span>;
      const href = `/ravens-eye?item=${encodeURIComponent(id)}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`;
      return (
        <Link key={index} href={href} className={styles.sharedReelCard}>
          <span className={styles.sharedReelPoster}>
            <img src={entry.src} alt="" loading="lazy" decoding="async" />
          </span>
          <span className={styles.sharedReelCopy}>
            <small>Raven&apos;s Eye</small>
            <strong>{entry.caption?.trim() || "Shared image"}</strong>
            <em>Open image</em>
          </span>
        </Link>
      );
    }

    return part;
  })}</p>;
}
