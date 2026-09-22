import Link from "next/link";
import { ToolMark, WorkbenchHeader, type ToolKind } from "./WorkbenchShell";
import styles from "./workbench.module.css";

const groups: Array<{ title: string; tools: Array<{ href: string; kind: ToolKind; name: string; text: string }> }> = [
  { title: "Chronology", tools: [
    { href: "/workbench/age-at-date", kind: "age", name: "Age at Date", text: "Find an age on a world date—or the dates for an age." },
    { href: "/workbench/date-reckoner", kind: "reckoner", name: "Date Reckoner", text: "Measure intervals and shift dates by years, moons, or days." },
    { href: "/workbench/nameday", kind: "nameday", name: "Nameday Randomizer", text: "Roll reusable namedays with character-aware constraints." },
  ]},
  { title: "People", tools: [
    { href: "/workbench/namesmith", kind: "names", name: "The Namesmith", text: "Forge culture-aware names for people, places, beasts, and more." },
    { href: "/workbench/kinship", kind: "kinship", name: "Kinship Finder", text: "Trace two characters through the existing family records." },
  ]},
  { title: "Story", tools: [
    { href: "/workbench/open-threads", kind: "threads", name: "Open Threads", text: "Track unresolved story threads and their latest developments." },
    { href: "/workbench/roads-and-ravens", kind: "roads", name: "Roads & Ravens", text: "Estimate passage between known places across the realm." },
  ]},
];

export default function WorkbenchPage() {
  return <main className={styles.page}><WorkbenchHeader>Practical instruments for chronology, people, journeys, and story continuity.</WorkbenchHeader>
    <div className={styles.toolGroups}>{groups.map((group) => <section key={group.title} className={styles.toolGroup}><h2 className={styles.groupTitle}>{group.title}</h2><div className={styles.landingGrid}>{group.tools.map((tool) => <Link href={tool.href} className={styles.toolLinkCard} key={tool.href}><span className={styles.toolIcon}><ToolMark kind={tool.kind}/></span><span className={styles.cardCopy}><strong>{tool.name}</strong><small>{tool.text}</small></span><span className={styles.cardArrow} aria-hidden="true">›</span></Link>)}</div></section>)}</div>
  </main>;
}
