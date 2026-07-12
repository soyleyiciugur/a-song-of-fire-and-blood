// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\_template\page.tsx
//
// TEMPLATE — copy this folder (page.tsx + template.module.css) into a new
// app/your-page/ directory when starting a new public page. Rename the
// .module.css file and the `styles` import to match.
//
// Uses only globals: var(--gold/text/muted/surface/border/radius-*), plus
// the shared classes from styles/common.css (.page-shell, .page-heading,
// .te-select, .te-pill, .section-divider). For a dropdown, import
// { Select } from "../_components/Select" — same one ravens-eye/page.tsx
// uses, so it automatically matches the rest of the site.
"use client";

import styles from "./template.module.css";

export default function TemplatePage() {
  return (
    <div className="page-shell">
      <div className="page-shell-inner">
        <h1 className="page-heading">Page Title</h1>
        <p className="page-subheading">One or two lines describing what this page is for.</p>

        {/* Page-specific content goes here. Add layout rules (grids,
            cards, etc.) to template.module.css — don't inline them. */}
        <div className={styles.content}>Content goes here.</div>
      </div>
    </div>
  );
}