import Image from "next/image";
import Link from "next/link";

import { NAV_ITEMS } from "@/constants/navigation";
import { getRandomQuote } from "@/lib/characters";
import CharacterQuote from "@/components/character/CharacterQuote";

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
      </div>

      <div className="container home-content">
        <h1 className="page-title">
          A Song of Fire and Blood
        </h1>

        <p className="page-subtitle">
          A living chronicle of House Targaryen.
        </p>

        <div className="button-row">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="button">
              {item.label}
            </Link>
          ))}
        </div>

        {featuredQuote ? (
          <div style={{ marginTop: 28, maxWidth: 760 }}>
            <CharacterQuote quote={featuredQuote} compact showAttribution />
          </div>
        ) : null}
      </div>
    </main>
  );
}
