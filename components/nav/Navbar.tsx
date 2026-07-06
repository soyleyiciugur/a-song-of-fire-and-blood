import Link from "next/link";

import SearchBar from "./SearchBar";

import styles from "./navbar.module.css";

export default function Navbar() {
  return (
    <header className={styles.banner}>
      <div className={styles.inner}>
        <Link href="/" className={styles.homeLink}>
          A Song of Fire and Blood
        </Link>

        <nav className={styles.navLinks}>
          <Link href="/chapters" className={styles.navLink}>
            Chapters
          </Link>
          <Link href="/characters" className={styles.navLink}>
            Characters
          </Link>
          <Link href="/family-tree" className={styles.navLink}>
            Family Tree
          </Link>
          <Link href="/houses" className={styles.navLink}>
            Houses
          </Link>
          <Link href="/relationships" className={styles.navLink}>
            Relationships
          </Link>
          <Link href="/dragons" className={styles.navLink}>
            Dragons
          </Link>
          <Link href="/timeline" className={styles.navLink}>
            Timeline
          </Link>
        </nav>

        <SearchBar />
      </div>
    </header>
  );
}
