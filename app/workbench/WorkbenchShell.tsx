import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./workbench.module.css";

export type ToolKind = "roads" | "names" | "threads" | "kinship" | "age" | "reckoner" | "nameday";

export function ToolMark({ kind }: { kind: ToolKind }) {
  const paths: Record<ToolKind, ReactNode> = {
    roads: <><circle cx="14" cy="14" r="9"/><circle cx="14" cy="14" r="2"/><path d="M14 5v7m0 4v7M5 14h7m4 0h7M7.6 7.6l5 5m2.8 2.8 5 5m-12.8 0 5-5m2.8-2.8 5-5"/></>,
    names: <><path d="M21 5c-5 .7-9.8 4.7-12.3 10.4-.8 1.8-1.3 3.7-1.6 5.6 2.1-.2 4-.8 5.8-1.7C18.4 16.5 21.7 10 21 5Z"/><path d="M7.8 20.4c3.3-4.3 6.7-7.4 10.2-9.2M5.5 23h11"/></>,
    threads: <><path d="M7 5.5h14v12H10l-4 4v-16Z"/><path d="M10 9h8m-8 4h6"/></>,
    kinship: <><circle cx="14" cy="6" r="2.5"/><circle cx="7" cy="20" r="2.5"/><circle cx="21" cy="20" r="2.5"/><path d="M14 8.5V13M7 17.5V14h14v3.5"/></>,
    age: <><circle cx="14" cy="14" r="9"/><path d="M14 9v5l3.5 2M10 3.8 14 2l4 1.8"/></>,
    reckoner: <><rect x="5" y="6.5" width="18" height="16" rx="2"/><path d="M9 4v5m10-5v5M5 11h18M9 15h2m3 0h2m3 0h1M9 19h2m3 0h2"/></>,
    nameday: <><path d="M6 22h16M8 22v-9h12v9M10 13V9h8v4M14 9V5"/><path d="M14 5c-2-2 .2-3.6 0-3.6S16 3 14 5ZM8 17h12"/></>,
  };
  return <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>;
}

export function WorkbenchHeader({ title = "The Workbench", children }: { title?: string; children: ReactNode }) {
  return <header className={styles.hero}><p className={styles.kicker}>Realm utilities</p><h1>{title}</h1><p>{children}</p>{title !== "The Workbench" && <Link className={styles.backLink} href="/workbench">← All instruments</Link>}</header>;
}

export function ToolHeading({ kind, eyebrow, title }: { kind: ToolKind; eyebrow: string; title: string }) {
  return <div className={styles.toolHeading}><span className={styles.toolIcon}><ToolMark kind={kind}/></span><div><p>{eyebrow}</p><h2>{title}</h2></div></div>;
}
