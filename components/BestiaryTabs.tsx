import Link from "next/link";
import archiveStyles from "@/app/records/records.module.css";
import { beastTypes } from "@/data/bestiary";
export { beastTypes } from "@/data/bestiary";

export default function BestiaryTabs({ active }: { active: string }) {
  return <nav className="realm-section-tabs" aria-label="Bestiary sections">{beastTypes.map((beast) => <Link key={beast.id} href={`/bestiary/${beast.id}`} aria-current={active === beast.id ? "page" : undefined}>{beast.name}</Link>)}</nav>;
}

export function BackToBestiary() {
  return <Link href="/bestiary" className={archiveStyles.backLink}>← The Bestiary</Link>;
}
