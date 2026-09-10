// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\page.tsx
import Image from "next/image";
import Link from "next/link";

import { NAV_ITEMS, isNavigationGroup } from "@/constants/navigation";
import { getRandomQuote } from "@/lib/characters";
import CharacterQuote from "@/components/character/CharacterQuote";
import WorldDateCard from "@/components/home/WorldDateCard";
import RavenEyeCard from "@/components/home/RavenEyeCard";
import ChronicleTimeline from "@/components/home/ChronicleTimeline";
import LatestUpdates from "@/components/home/LatestUpdates";
import RealmLedgerCard from "@/components/home/RealmLedgerCard";

export const dynamic = "force-dynamic";

export default function Home() {
  const featuredQuote = getRandomQuote();
  return (
    <main className="home-page">
      <div className="hero">
        <Image
          src="/images/home/a-song-of-fire-and-blood.webp"
          alt="A Song of Fire and Blood"
          fill
          preload
          unoptimized
          sizes="100vw"
          className="hero-image"
        />
        <div className="hero-fade" />

        <div className="hero-caption">
          <span className="hero-eyebrow">A Living Chronicle</span>
          <h1 className="page-title">A Song of Fire and Blood</h1>
          <p className="page-subtitle">
            The rise, ruin, and rivalries of House Targaryen — told one chapter, one house, one dragon at a time.
          </p>
        </div>
      </div>

      <div className="container home-content">
        <div className="button-row">
          {NAV_ITEMS.map((item) => {
            const href = isNavigationGroup(item) ? item.href : item.href;
            if (!href) return null;
            return <Link key={href} href={href} className="button">{item.label}</Link>;
          })}
          <Link href="/forum" className="button">Taverns</Link>
        </div>

        <div className="home-divider" aria-hidden="true">
          <span className="home-divider-glyph">⚔</span>
        </div>

        <div className="home-grid">
          <div className="home-left-col">
            <div className="card card-padding home-quote-card">
              <span className="home-quote-label">From the Chronicle</span>
              {featuredQuote ? <CharacterQuote quote={featuredQuote} compact showAttribution /> : null}
            </div>
            <RavenEyeCard />
          </div>
          <div className="home-right-col">
            <WorldDateCard />
            <RealmLedgerCard />
          </div>
        </div>
        <LatestUpdates />
        <ChronicleTimeline />
      </div>
    </main>
  );
}
