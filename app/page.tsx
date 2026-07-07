import Image from "next/image";
import Link from "next/link";

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
          priority
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
          <Link href="/chapters" className="button">
            Chapters
          </Link>

          <Link href="/characters" className="button">
            Characters
          </Link>

          <Link href="/family-tree" className="button">
            Family Tree
          </Link>

          <Link href="/houses" className="button">
            Houses
          </Link>

          <Link href="/map" className="button">
            Map
          </Link>

          <Link href="/relationships" className="button">
            Relationships
          </Link>

          <Link href="/dragons" className="button">
            Dragons
          </Link>

          <Link href="/timeline" className="button">
            Timeline
          </Link>
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