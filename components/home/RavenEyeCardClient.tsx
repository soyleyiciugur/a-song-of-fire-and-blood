"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import styles from "./ravenEyeCard.module.css";

type RavenEyeCardClientProps = {
  id: string;
  src: string;
  caption: string;
};

export default function RavenEyeCardClient({ id, src, caption }: RavenEyeCardClientProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || window.matchMedia("(max-width: 860px)").matches) return;

    // Let the original desktop grid establish its normal first-load proportions,
    // then freeze that exact height. Calendar expansion on the neighbouring
    // column must not resize or vertically shift this card afterwards.
    const initialHeight = Math.round(card.getBoundingClientRect().height);
    if (initialHeight <= 0) return;

    card.style.setProperty("--raven-card-initial-height", `${initialHeight}px`);
    card.dataset.heightFrozen = "true";
  }, []);

  return (
    <Link
      ref={cardRef}
      href={`/ravens-eye?item=${id}&returnTo=${encodeURIComponent("/")}`}
      className={`${styles.card} card card-padding`}
    >
      <span className="home-quote-label">From the Raven&apos;s Eye</span>
      <div className={styles.imageWrap}>
        <Image src={src} alt={caption || "Raven's Eye"} fill className={styles.image} />
      </div>
      {caption && <p className={styles.caption}>{caption}</p>}
    </Link>
  );
}
