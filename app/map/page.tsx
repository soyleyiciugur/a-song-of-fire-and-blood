import InteractiveMap from "@/components/map/InteractiveMap";

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

        <InteractiveMap />
      </div>
    </main>
  );
}
