// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\map\page.tsx
import InteractiveMap from "@/components/map/InteractiveMap";
import Link from "next/link";
import { Suspense } from "react";

import styles from "./map.module.css";

export default function MapPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>The Known World</h1>
        <p className={styles.subheading}>
          Follow the chronicle chapter by chapter. Drag to explore, scroll to
          zoom, and click a face to trace where they&apos;ve been.
        </p>

        <nav className={styles.tabs} aria-label="Known World sections"><Link className={styles.activeTab} href="/map">Map</Link><Link href="/locations">Locations</Link></nav>
        <Suspense fallback={<div style={{ minHeight: 520 }} aria-busy="true" /> }><InteractiveMap /></Suspense>
      </div>
    </main>
  );
}
