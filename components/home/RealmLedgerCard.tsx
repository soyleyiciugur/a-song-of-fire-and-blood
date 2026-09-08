import Link from "next/link";
import { getAllChapters } from "@/data/chapters";
import { getCharacters } from "@/lib/characters";
import { dragons } from "@/data/dragons";
import events from "@/data/events.json";

const figures = [
  ["Characters", getCharacters().filter((character) => !character.hidden).length, "/characters"],
  ["Dragons", dragons.length, "/bestiary"],
  ["Chapters", getAllChapters().length, "/chapters"],
  ["Annals", events.length, "/chronicle"],
] as const;

export default function RealmLedgerCard() {
  return (
    <aside className="card card-padding realm-ledger-card">
      <div className="home-quote-label">The Realm&apos;s Ledger</div>
      <p className="realm-ledger-intro">A living count of what the archive has recorded.</p>
      <div className="realm-ledger-grid">
        {figures.map(([label, value, href]) => (
          <Link key={label} href={href} className="realm-ledger-stat">
            <strong>{value}</strong>
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
