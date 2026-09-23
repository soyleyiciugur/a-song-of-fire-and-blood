import type { ReactNode } from "react";
import styles from "./interactive-map.module.css";

export default function MapLayerToggle({ checked, onChange, children, separated = false }: {
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
  separated?: boolean;
}) {
  return (
    <label className={`${styles.legendRow} ${separated ? styles.regionToggle : ""}`} onClick={(event) => event.stopPropagation()}>
      <input className={styles.layerInput} type="checkbox" checked={checked} onChange={onChange} />
      <span className={styles.layerCheckbox} aria-hidden="true">
        {checked && <svg width="8" height="6" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1.5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </span>
      {children}
    </label>
  );
}
