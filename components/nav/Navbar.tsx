"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, isNavigationGroup } from "@/constants/navigation";
import SearchBar from "./SearchBar";
import AccountControl from "./AccountControl";

import styles from "./navbar.module.css";

export default function Navbar() {
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const measure = () => document.documentElement.style.setProperty("--site-nav-height", `${header.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    measure();
    return () => observer.disconnect();
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const pathname = usePathname();
  const isPlayPage = pathname === "/cards" || pathname.startsWith("/cards/");
  const [navExpanded, setNavExpanded] = useState(() => !isPlayPage);

  useEffect(() => {
    setNavExpanded(!isPlayPage);
    setMenuOpen(false);
    setOpenGroup(null);
  }, [isPlayPage, pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        headerRef.current?.querySelector<HTMLButtonElement>('[aria-controls="site-mobile-nav"]')?.focus();
      }
    };
    const media = window.matchMedia("(min-width: 1151px)");
    const resize = () => { if (media.matches) setMenuOpen(false); };
    document.addEventListener("keydown", close);
    media.addEventListener("change", resize);
    return () => { document.removeEventListener("keydown", close); media.removeEventListener("change", resize); };
  }, [menuOpen]);

  return (
    <header
      ref={headerRef}
      className={[
        styles.banner,
        styles.playBanner,
        !navExpanded
          ? styles.playBannerCollapsed
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.inner}>
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



        <Link href="/" className={styles.homeLink}>
          A Song of Fire and Blood
        </Link>

        <button
          type="button"
          className={styles.playNavToggle}
          aria-expanded={navExpanded}
          aria-label={
            navExpanded
              ? "Collapse site navigation"
              : "Expand site navigation"
          }
          onClick={() => {
            setNavExpanded((expanded) => !expanded);
            setMenuOpen(false);
            setOpenGroup(null);
          }}
        >
          <span
            className={[
              styles.playNavToggleIcon,
              navExpanded ? styles.playNavToggleIconUp : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden="true"
          >
            <i />
            <i />
          </span>
        </button>

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
                  className={`${styles.navLink} ${
                    (item.href && pathname.startsWith(item.href)) ||
                    item.items.some((sub) => pathname.startsWith(sub.href))
                      ? styles.active
                      : ""
                  }`}
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

        <SearchBar />
        <AccountControl />
        <Link href="/notifications" className={styles.notificationsButton} aria-label="Notifications" title="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
        <Link href="/forum" className={`${styles.notificationsButton} ${styles.forumButton}`} aria-label="Taverns" title="Taverns">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4h16v12H9l-5 4V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M8 8h8M8 12h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </Link>
      </div>

      {menuOpen && <button className={styles.menuBackdrop} tabIndex={-1} aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <nav
        aria-label="Mobile navigation"
        inert={!menuOpen}
        id="site-mobile-nav"
        className={`${styles.mobileNav} ${menuOpen ? styles.mobileNavOpen : ""}`}
      >
        <AccountControl />
        {NAV_ITEMS.map((item) =>
          isNavigationGroup(item) ? (
            <div key={item.label} className={styles.mobileNavGroup}>
              <div className={styles.mobileNavGroupHeaderRow}>
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
                  aria-expanded={openMobileGroup === item.label}
                  onClick={() =>
                    setOpenMobileGroup((current) =>
                      current === item.label ? null : item.label
                    )
                  }
                  aria-label={`Toggle ${item.label} menu`}
                >
                  <span className={styles.navGroupCaret} aria-hidden="true">
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
      </nav>
    </header>
  );
}
