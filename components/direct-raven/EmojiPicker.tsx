"use client";

import { useEffect, useMemo, useState } from "react";
import { EMOJI_CATEGORIES } from "./emojiData";
import styles from "./direct-raven.module.css";

const RECENT_KEY = "asofab:raven-recent-emojis";

export default function EmojiPicker({ onSelect, compact = false }: { onSelect: (emoji: string) => void; compact?: boolean }) {
  const [category, setCategory] = useState("recent");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]").slice(0, 24)); } catch {}
  }, []);

  const emojis = useMemo(() => category === "recent"
    ? (recent.length ? recent : EMOJI_CATEGORIES[0].emojis.slice(0, 24))
    : (EMOJI_CATEGORIES.find((item) => item.id === category)?.emojis ?? []), [category, recent]);

  const choose = (emoji: string) => {
    const next = [emoji, ...recent.filter((item) => item !== emoji)].slice(0, 24);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
    onSelect(emoji);
  };

  return <div className={`${styles.fullEmojiPicker} ${compact ? styles.compactEmojiPicker : ""}`}>
    <div className={styles.emojiCategories} role="tablist" aria-label="Emoji categories">
      <button type="button" className={category === "recent" ? styles.emojiCategoryActive : ""} onClick={() => setCategory("recent")} title="Recent" aria-label="Recent emojis">◷</button>
      {EMOJI_CATEGORIES.map((item) => <button key={item.id} type="button" className={category === item.id ? styles.emojiCategoryActive : ""} onClick={() => setCategory(item.id)} title={item.label} aria-label={item.label}>{item.icon}</button>)}
    </div>
    <div className={styles.emojiGrid} aria-label="Choose emoji">
      {emojis.map((emoji, index) => <button key={`${emoji}-${index}`} type="button" onClick={() => choose(emoji)}>{emoji}</button>)}
    </div>
  </div>;
}
