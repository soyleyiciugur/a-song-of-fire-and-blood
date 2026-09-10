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

export default function RavenMessageContent({ body }: { body: string }) {
  const { text, portraitIds } = parseRavenBody(body);

  return (
    <>
      {text && <p>{text}</p>}
      {portraitIds.length > 0 && (
        <div className={styles.messagePortraits} aria-label="Mini portraits">
          {portraitIds.map((id, index) => {
            const name = characterNames.get(id) ?? id.replaceAll("-", " ");
            return (
              <span className={styles.messagePortrait} key={`${id}-${index}`} title={name}>
                <MiniPortrait id={id} alt={name} size={58} />
              </span>
            );
          })}
        </div>
      )}
    </>
  );
}
