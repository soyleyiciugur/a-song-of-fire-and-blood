"use client";

import type { ReactNode } from "react";
import Link from "next/link";

const HOME_SCROLL_KEY = "asofab:home-latest-scroll";

export default function LatestMediaLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        try { sessionStorage.setItem(HOME_SCROLL_KEY, String(window.scrollY)); } catch {}
      }}
    >
      {children}
    </Link>
  );
}
