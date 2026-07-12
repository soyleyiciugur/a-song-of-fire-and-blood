// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\book-of-brothers\page.tsx
import Link from "next/link";
import { getAllKingsguardEntries } from "@/lib/bookOfBrothers";
import { getCharacter } from "@/lib/characters";
import SigilImage from "@/components/SigilImage"; // Projendeki tam path'e göre ayarla
import styles from "./book-of-brothers.module.css";

export const metadata = {
  title: "The Book of Brothers",
};

// Karakterin ev adına göre dosya adını (slug) çıkaran yardımcı fonksiyon
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

export default function BookOfBrothersPage() {
  // 1. Girdileri çek ve işlenmiş verileri ekle
  const entries = getAllKingsguardEntries().map((entry) => {
    const character = entry.characterId ? getCharacter(entry.characterId) : undefined;
    const name = character?.name ?? entry.manualName ?? "Unknown Knight";
    const houseId = getHouseId(character, entry.manualName);
    
    return { ...entry, character, computedName: name, houseId };
  });

  // 2. A'dan Z'ye isme göre alfabetik sırala
  entries.sort((a, b) => a.computedName.localeCompare(b.computedName));

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>The White Book</p>
        <h1 className={styles.pageTitle}>The Book of Brothers</h1>
        <p className={styles.pageIntro}>
          The record of every knight who has worn the white cloak — their
          vows, their years of service, and the deeds set down in their name.
        </p>
      </header>

      <ol className={styles.entryList}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link href={`/book-of-brothers/${entry.id}`} className={styles.entryCard}>
              
              {/* Senin SigilImage bileşenin */}
              <SigilImage
                src={`/images/houses/${entry.houseId}.webp`}
                alt={entry.computedName}
                size={44} // Liste kartı için ideal boyut
                shape="circle"
                fallbackText={entry.computedName.slice(0, 2).toUpperCase()}
              />
              
              <div>
                <h2>{entry.computedName}</h2>
                <p className={styles.entryDates}>
                  {entry.appointedDate ?? "Date unknown"}
                  {" — "}
                  {entry.endDate ?? "present"}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      {entries.length === 0 && (
        <p className={styles.empty}>
          No entries have been recorded in the White Book yet.
        </p>
      )}
    </div>
  );
}