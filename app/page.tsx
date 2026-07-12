// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\page.tsx
import Image from "next/image";
import Link from "next/link";

import { FLAT_NAV_ITEMS } from "@/constants/navigation"; // NAV_ITEMS yerine
import { getRandomQuote } from "@/lib/characters";
import CharacterQuote from "@/components/character/CharacterQuote";
import WorldDateCard from "@/components/home/WorldDateCard";

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
          {FLAT_NAV_ITEMS
            .filter((item) => item.href !== "/scrolls" && item.href !== "/book-of-brothers" && item.href !== "/family-tree" && item.href !== "/relationships")
            .map((item) => (
              <Link key={item.href} href={item.href} className="button">
                {item.label}
              </Link>
            ))}
        </div>

        <div className="home-divider" aria-hidden="true">
          <span className="home-divider-glyph">⚔</span>
        </div>

        <div className="home-grid">
          <div className="card card-padding home-quote-card">
            <span className="home-quote-label">From the Chronicle</span>
            {featuredQuote ? (
              <CharacterQuote quote={featuredQuote} compact showAttribution />
            ) : null}
          </div>

          <WorldDateCard />
        </div>
      </div>
    </main>
  );
}