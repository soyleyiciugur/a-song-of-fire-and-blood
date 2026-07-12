// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\components\nav\Navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, isNavigationGroup } from "@/constants/navigation";
import SearchBar from "./SearchBar";

import styles from "./navbar.module.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <header className={styles.banner}>
      <div className={styles.inner}>
        <Link href="/" className={styles.homeLink}>
          A Song of Fire and Blood
        </Link>

        <nav className={styles.navLinks}>
          {NAV_ITEMS.map((item) =>
            isNavigationGroup(item) ? (
              <div
                key={item.label}
                className={styles.navGroup}
                onMouseEnter={() => setOpenGroup(item.label)}
                onMouseLeave={() => setOpenGroup(null)}
              >
                <Link
                  href={item.href || "#"}
                  className={`${styles.navLink} ${pathname.startsWith(item.href || "") ? styles.active : ""}`}
                >
                  {item.label}
                </Link>

                <button
                  type="button"
                  className={styles.navGroupCaretBtn}
                  aria-expanded={openGroup === item.label}
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenGroup((current) => (current === item.label ? null : item.label));
                  }}
                  aria-label={`Toggle ${item.label} menu`}
                >
                  <span className={styles.navGroupCaret} aria-hidden="true">
                    ▾
                  </span>
                </button>

                {openGroup === item.label && (
                  <div className={styles.navGroupMenu}>
                    {item.items.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={styles.navGroupMenuLink}
                        onClick={() => setOpenGroup(null)}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${pathname === item.href ? styles.active : ""}`}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={menuOpen}
          aria-controls="site-mobile-nav"
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span className={styles.menuIcon} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <SearchBar />
      </div>

      <div
        id="site-mobile-nav"
        className={`${styles.mobileNav} ${menuOpen ? styles.mobileNavOpen : ""}`}
      >
        {NAV_ITEMS.map((item) =>
          isNavigationGroup(item) ? (
            <div key={item.label} className={styles.mobileNavGroup}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Link
                  href={item.href || "#"}
                  className={styles.mobileNavLink}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
                <button
                  type="button"
                  className={styles.mobileNavGroupHeader}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "8px",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  aria-expanded={openMobileGroup === item.label}
                  onClick={() =>
                    setOpenMobileGroup((current) =>
                      current === item.label ? null : item.label
                    )
                  }
                  aria-label={`Toggle ${item.label} menu`}
                >
                  <span className={styles.navGroupCaret} aria-hidden="true" style={{ fontSize: "0.8rem", color: "var(--gold)" }}>
                    {openMobileGroup === item.label ? "▴" : "▾"}
                  </span>
                </button>
              </div>

              {openMobileGroup === item.label && (
                <div className={styles.mobileNavGroupItems}>
                  {item.items.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={styles.mobileNavLink}
                      onClick={() => {
                        setMenuOpen(false);
                        setOpenMobileGroup(null);
                      }}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={styles.mobileNavLink}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          )
        )}
      </div>
    </header>
  );
}