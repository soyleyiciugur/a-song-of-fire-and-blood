"use client";

import MiniPortrait from "@/components/MiniPortrait";
import charactersData from "@/data/characters/characters.json";
import styles from "./direct-raven.module.css";

const PORTRAIT_TOKEN = /\[\[portrait:([a-z0-9-]+)\]\]/gi;

type CharacterRecord = {
  id: string;
  name: string;
};

const characterNames = new Map(
  (charactersData as CharacterRecord[]).map((character) => [character.id, character.name])
);

export function parseRavenBody(value: string) {
  const portraitIds: string[] = [];
  const text = value
    .replace(PORTRAIT_TOKEN, (_match, id: string) => {
      portraitIds.push(id.toLowerCase());
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, portraitIds };
}

export function encodeRavenBody(text: string, portraitIds: string[]) {
  const cleanText = text.trim();
  const tokens = portraitIds.map((id) => `[[portrait:${id}]]`).join(" ");
  return [cleanText, tokens].filter(Boolean).join("\n");
}

export function ravenBodySummary(value: string) {
  const { text, portraitIds } = parseRavenBody(value);
  if (text) return text;
  if (portraitIds.length === 1) return "Mini portrait";
  if (portraitIds.length > 1) return `${portraitIds.length} mini portraits`;
  return "Raven";
}

export function RavenMessagePreview({ body }: { body: string }) {
  return <>{body.split(/(\[\[portrait:[a-z0-9-]+\]\])/gi).map((part, index) => {
    const match = /^\[\[portrait:([a-z0-9-]+)\]\]$/i.exec(part);
    if (!match || !characterNames.has(match[1].toLowerCase())) return part;
    const id = match[1].toLowerCase();
    return <span key={index} className={styles.previewPortrait} title={characterNames.get(id)}><MiniPortrait id={id} alt="" size={18} /></span>;
  })}</>;
}

export default function RavenMessageContent({ body }: { body: string }) {
  return <p>{body.split(/(\[\[portrait:[a-z0-9-]+\]\])/gi).map((part, index) => {
    const match = /^\[\[portrait:([a-z0-9-]+)\]\]$/i.exec(part);
    if (!match || !characterNames.has(match[1].toLowerCase())) return part;
    const id = match[1].toLowerCase();
    return <span key={index} className={styles.inlinePortrait} title={characterNames.get(id)}><MiniPortrait id={id} alt={characterNames.get(id)!} size={28} /></span>;
  })}</p>;
}
