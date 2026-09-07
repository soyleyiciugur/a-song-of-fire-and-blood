"use client";

import { useEffect } from "react";
import styles from "./family-tree.module.css";

export default function FamilyTreeFocus({ focusId }: { focusId?: string }) {
  useEffect(() => {
    if (!focusId) return;

    const selector = `a[href="/characters/${CSS.escape(focusId)}"]`;
    const matches = Array.from(document.querySelectorAll<HTMLElement>(selector));
    const target = matches[0];

    if (!target) return;

    target.classList.add(styles.focusTarget);

    const timeout = window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }, 80);

    return () => {
      window.clearTimeout(timeout);
      target.classList.remove(styles.focusTarget);
    };
  }, [focusId]);

  return null;
}
