"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, isNavigationGroup } from "@/constants/navigation";
import SearchBar from "./SearchBar";
import AccountControl from "./AccountControl";
import DirectRavenNavButton from "@/components/direct-raven/DirectRavenNavButton";
import NotificationNavButton from "./NotificationNavButton";

import styles from "./navbar.module.css";

export default function Navbar() {
  const headerRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
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
  const [navExpanded, setNavExpanded] = useState(true);

  useEffect(() => {
    setMenuOpen(false);
    setOpenGroup(null);
  }, [pathname]);

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

        <Link
          href="/"
          className={styles.houseMark}
          aria-label="Home"
          title="Home"
        >
          <Image src="/images/houses/targaryen.webp" alt="" width={36} height={36} quality={100} sizes="36px" />
        </Link>


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
        <Link href="/ravens-eye" className={`${styles.notificationsButton} ${styles.ravenEyeButton}`} aria-label="The Raven's Eye" title="The Raven's Eye">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M2.5 12s3.7-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.7 5.5-9.5 5.5-9.5-5.5-9.5-5.5Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="2.6" fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </Link>
        <Link href="/cards" className={`${styles.notificationsButton} ${styles.gameButton}`} aria-label="The Great Game" title="The Great Game">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="5.5" y="3.5" width="13" height="17" rx="1.8" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="1.5" transform="rotate(8 12 12)" />
            <rect x="4.5" y="4.5" width="13" height="17" rx="1.8" fill="var(--surface)" stroke="currentColor" strokeWidth="1.5" transform="rotate(-8 12 12)" />
            <path d="M9 10h.01M15 14h.01M9 14h.01M15 10h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
        <Link href="/forum" className={`${styles.notificationsButton} ${styles.forumButton}`} aria-label="Taverns" title="Taverns">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4h16v12H9l-5 4V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M8 8h8M8 12h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </Link>
        <DirectRavenNavButton />
        <NotificationNavButton />
        <AccountControl />
      </div>

      {menuOpen && <button className={styles.menuBackdrop} tabIndex={-1} aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <nav
        aria-label="Mobile navigation"
        inert={!menuOpen}
        id="site-mobile-nav"
        className={`${styles.mobileNav} ${menuOpen ? styles.mobileNavOpen : ""}`}
      >
        <Link href="/" className={styles.mobileSiteTitle} onClick={() => setMenuOpen(false)}>
          <span className={styles.mobileSiteMark} aria-hidden="true">
            <Image src="/images/houses/targaryen.webp" alt="" width={30} height={30} quality={100} sizes="30px" />
          </span>
          <span>A Song of Fire and Blood</span>
        </Link>

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
            <div key={item.href} className={styles.mobileNavPlainItem}>
              <Link
                href={item.href}
                className={styles.mobileNavLink}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            </div>
          )
        )}
      </nav>
    </header>
  );
}
