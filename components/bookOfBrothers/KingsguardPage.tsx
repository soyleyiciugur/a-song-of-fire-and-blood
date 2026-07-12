// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\components\bookOfBrothers\KingsguardPage.tsx
import React from "react";
import SigilImage from "@/components/SigilImage";
import styles from "./kingsguardEntry.module.css";

function getHouseId(character: any, manualName?: string) {
  if (character?.house && character.house !== "-") {
    return character.house.replace(/^House\s+/i, "").toLowerCase();
  }
  if (manualName) {
    const parts = manualName.split(" ");
    return parts[parts.length - 1].toLowerCase();
  }
  return "kingsguard";
}

export default function KingsguardPage({ entry, character, precedingCharacter }: any) {
  const name = character?.name ?? entry.manualName ?? "Unknown Knight";
  const title = character?.title ?? entry.manualTitle;
  const houseId = getHouseId(character, entry.manualName);

  return (
    <article className={styles.page}>
      
      {/* Dekoratif Toka */}
      <div className={styles.clasp} aria-hidden="true">
        <svg viewBox="0 0 40 40" className={styles.claspIcon}>
          <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M20 8 L20 32 M11 14 L29 26 M29 14 L11 26" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      <header className={styles.header}>
        <SigilImage
          src={`/images/houses/${houseId}.webp`}
          alt={name}
          size={84}
          shape="circle"
          fallbackText={name.slice(0, 2).toUpperCase()}
        />

        <div>
          <p className={styles.eyebrow}>The Kingsguard</p>
          <h1 className={styles.name}>{name}</h1>
          {title && <p className={styles.title}>{title}</p>}
          
          {/* İstemediğin etiketler kaldırıldı, sadece temiz tarihler kaldı */}
          <p className={styles.dates}>
            {entry.appointedDate ?? "Date unknown"}
            {" — "}
            {entry.endDate ?? "present"}
          </p>
        </div>
      </header>

      {entry.oath && (
        <blockquote className={styles.oath}>
          <span className={styles.oathMark}>"</span>
          {entry.oath}
          <span className={styles.oathMark}>"</span>
        </blockquote>
      )}

      <h3 className={styles.deedsTitle}>Recorded Deeds</h3>
      <ul className={styles.deedsList}>
        {entry.deeds.map((deed: any, idx: number) => (
          <li key={idx} className={styles.deedItem}>
            {deed.description}
          </li>
        ))}
      </ul>

      {entry.notes && (
        <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          <p className={styles.title}>Lord Commander's Notes:</p>
          <p className={styles.deedItem} style={{ fontStyle: "italic", marginTop: "0.5rem" }}>
            {entry.notes}
          </p>
        </div>
      )}
    </article>
  );
}