"use client";

import Image from "next/image";
import Link from "next/link";
import MiniPortrait from "@/components/MiniPortrait";
import { useSpoilerBoundary } from "@/components/reading/ReadingProgressProvider";
import charactersData from "@/data/characters/characters.json";
import forumData from "@/data/forum.json";
import galleryData from "@/data/gallery.json";
import characterPositionsData from "@/data/map/character-positions.json";
import { timeline } from "@/data/timeline";
import { getChapterDragonAppearances } from "@/data/dragon-appearances";
import UtilityIcon from "@/components/nav/UtilityIcon";
import styles from "./chapterCompanion.module.css";

type CharacterRow = { id: string; name: string; hidden?: boolean };
type GalleryRow = { id: string; src: string; caption?: string | null; category?: string; chapterId?: string | null };
type ForumThread = { id: string; chapterSlug?: string | null; body: string };
type ChapterPositions = Record<string, Record<string, string | string[]>>;

const characters = new Map((charactersData as CharacterRow[]).map((character) => [character.id, character]));

function isVideo(src: string) {
  return /\.(mp4|mov|webm)$/i.test(src);
}

function posterFor(src: string) {
  const filename = src.split("/").pop()?.replace(/\.[^.]+$/, ".webp");
  return filename ? `/videos/reels/posters/${filename}` : src;
}

function galleryHref(entry: GalleryRow) {
  const route = isVideo(entry.src) ? "/ravens-eye/reels" : entry.category === "fleabottom" ? "/ravens-eye/memes" : "/ravens-eye";
  return `${route}?item=${encodeURIComponent(entry.id)}`;
}

export default function ChapterCompanion({ chapterSlug }: { chapterSlug: string }) {
  const { canReveal } = useSpoilerBoundary();
  const chapterTimeline = timeline.find((chapter) => chapter.chapterSlug === chapterSlug);
  const castIds = [...new Set(chapterTimeline?.events.flatMap((event) => event.characters ?? []) ?? [])];
  const cast = castIds.map((id) => characters.get(id)).filter((character): character is CharacterRow => Boolean(character));
  const chapterPositions = (characterPositionsData as ChapterPositions)[chapterSlug] ?? {};
  const castPositions = castIds.flatMap((id) => {
    const value = chapterPositions[id];
    return value ? (Array.isArray(value) ? value : [value]) : [];
  }).filter((place) => place !== "-");
  const eventLocations = chapterTimeline?.events.flatMap((event) => event.location ? [event.location] : []) ?? [];
  const locations = [...new Set([...eventLocations, ...castPositions])];
  const routes = castIds.flatMap((id) => {
    const value = chapterPositions[id];
    return Array.isArray(value) && value.filter((place) => place !== "-").length > 1
      ? [{ character: characters.get(id), stops: value.filter((place) => place !== "-") }]
      : [];
  });
  const art = (galleryData as GalleryRow[]).filter((entry) => entry.chapterId === chapterSlug);
  const discussion = (forumData.threads as ForumThread[]).find((thread) => thread.chapterSlug === chapterSlug);
  const dragonAppearances = getChapterDragonAppearances(chapterSlug);
  const chapterDragons = [...new Map(dragonAppearances.map((appearance) => [appearance.dragonId, appearance])).values()];
  const revealed = canReveal(chapterSlug);

  return (
    <aside className={styles.wrap} aria-labelledby="chapter-companion-title">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Beyond the page</span>
          <h2 id="chapter-companion-title">Chapter Companion</h2>
        </div>
        <span className={styles.rule} aria-hidden="true">✦</span>
      </header>

      {!revealed ? (
        <div className={styles.sealed}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10M6 10h12v10H6z" /></svg>
          <div><strong>Companion records are sealed</strong><span>Mark this chapter as read to reveal its cast, places, routes, artwork and discussion.</span></div>
        </div>
      ) : (
        <div className={styles.grid}>
          <section className={styles.panel}>
            <div className={styles.panelHeading}><span aria-hidden="true">♙</span><div><small>On the page</small><h3>Chapter Cast</h3></div></div>
            {cast.length ? <ul className={styles.castList}>{cast.map((character) => (
              <li key={character.id}><Link href={`/characters/${character.id}`}><MiniPortrait id={character.id} alt="" size={42} /><span>{character.name}</span><b aria-hidden="true">›</b></Link></li>
            ))}</ul> : <p className={styles.empty}>No cast appearances have been recorded for this chapter yet.</p>}
            {chapterDragons.length > 0 && <div className={styles.chapterDragons}><small>Dragons in this chapter</small><div>{chapterDragons.map((dragon) => {
              const sceneCount = dragonAppearances.filter((item) => item.dragonId === dragon.dragonId).length;
              return <Link key={dragon.dragonId} href={`/dragons/${dragon.dragonId}`}><UtilityIcon name="dragon" /><span>{dragon.dragonName}</span><b>{sceneCount} {sceneCount === 1 ? "scene" : "scenes"}</b></Link>;
            })}</div></div>}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeading}><span aria-hidden="true">⌖</span><div><small>Across the realm</small><h3>Locations &amp; Routes</h3></div></div>
            {locations.length ? <div className={styles.locationList}>{locations.map((location) => <span key={location}>{location}</span>)}</div> : <p className={styles.empty}>No chapter locations have been recorded yet.</p>}
            {routes.length > 0 && <ul className={styles.routeList}>{routes.map(({ character, stops }, index) => <li key={`${character?.id ?? "route"}-${index}`}><strong>{character?.name ?? "Journey"}</strong><span>{stops.join(" → ")}</span></li>)}</ul>}
            <Link className={styles.primaryLink} href={`/map?chapter=${encodeURIComponent(chapterSlug)}`}>Open chapter map <span aria-hidden="true">→</span></Link>
          </section>

          <section className={`${styles.panel} ${styles.integrations}`}>
            <div className={styles.panelHeading}><span aria-hidden="true">✦</span><div><small>Related records</small><h3>Art &amp; Discussion</h3></div></div>
            {art.length > 0 && <div className={styles.artGrid}>{art.map((entry) => <Link href={galleryHref(entry)} key={entry.id} className={styles.artCard}><Image src={isVideo(entry.src) ? posterFor(entry.src) : entry.src} alt={entry.caption?.trim() || "Chapter artwork"} fill sizes="(max-width: 700px) 44vw, 180px" /><span>{isVideo(entry.src) ? "Watch reel" : "View artwork"}</span></Link>)}</div>}
            <div className={styles.integrationLinks}>
              {discussion ? <Link href={`/forum?thread=${encodeURIComponent(discussion.id)}`}><span><small>Chapter discussion</small>{discussion.body}</span><b aria-hidden="true">→</b></Link> : <span className={styles.empty}>No chapter discussion has been opened yet.</span>}
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}
