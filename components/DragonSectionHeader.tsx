import Link from "next/link";
import BestiaryTabs from "@/components/BestiaryTabs";
import styles from "@/app/dragons/scale/scale.module.css";

export default function DragonSectionHeader({ active, count }: { active: "archive" | "scale"; count?: number }) {
  const comparison = active === "scale";
  return <div className="realm-section-header">
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/bestiary">The Bestiary</Link><span>/</span>{comparison ? <><Link href="/bestiary/dragons">Dragons</Link><span>/</span><span>The Measure of Fire</span></> : <span>Dragons</span>}</nav>
    <header className={styles.hero}><div><p className={styles.eyebrow}>{comparison ? "A comparative study · Dragons of Westeros" : "The Bestiary · Dragons of Westeros"}</p><h1>{comparison ? "The Measure of Fire" : "Dragons"}</h1><p className={styles.lead}>{comparison ? "From the last flicker to the Black Dread. Place the dragons on a shared scale and see how far their shadows reach." : "The living fire of House Targaryen, and the flames that went out too soon."}</p></div>{count !== undefined && <div className={styles.seal}><strong>{count}</strong><span>dragons & records</span></div>}</header>
    <BestiaryTabs active="dragons" />
    <nav className={styles.subnav} aria-label="Dragon pages"><Link href="/bestiary/dragons" aria-current={!comparison ? "page" : undefined}>Dragon Archive</Link><Link href="/dragons/scale" aria-current={comparison ? "page" : undefined}>The Measure of Fire</Link></nav>
  </div>;
}
