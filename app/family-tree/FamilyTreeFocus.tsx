"use client";

import { useEffect } from "react";
import styles from "./family-tree.module.css";

export default function FamilyTreeFocus({ focusId }: { focusId?: string }) {
  useEffect(() => {
    if (!focusId) return;

    const selector = `a[href="/characters/${CSS.escape(focusId)}"]`;
    const matches = Array.from(document.querySelectorAll<HTMLElement>(selector));

    if (matches.length === 0) return;

    // A character can appear in several branches / unions. Highlight every
    // visible instance, not only the first copy rendered in the tree.
    matches.forEach((match) => match.classList.add(styles.focusTarget));

    // Prefer the copy inside the house section named by the URL hash.
    // Example: /family-tree?focus=gaelor-targaryen#house-targaryen
    let target = matches[0];

    if (window.location.hash) {
      try {
        const section = document.querySelector<HTMLElement>(window.location.hash);
        const inSection = section
          ? matches.find((match) => section.contains(match))
          : undefined;

        if (inSection) target = inSection;
      } catch {
        // Invalid/escaped hashes should never block highlighting.
      }
    }

    const timeout = window.setTimeout(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }, 80);

    return () => {
      window.clearTimeout(timeout);
      matches.forEach((match) => match.classList.remove(styles.focusTarget));
    };
  }, [focusId]);

  return null;
}
