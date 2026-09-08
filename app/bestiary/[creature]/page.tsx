import { notFound } from "next/navigation";
import BestiaryTabs, { beastTypes, BackToBestiary } from "@/components/BestiaryTabs";
import styles from "../bestiary.module.css";
export default async function CreaturePage({ params }: { params: Promise<{ creature: string }> }) {
  const { creature } = await params;
  const beast = beastTypes.find((type) => type.id === creature);
  if (!beast) notFound();
  return <main className={styles.page}><div className={styles.container}><p className={styles.eyebrow}>The Bestiary</p><h1 className="realm-page-title">{beast.name}</h1><p className={styles.lead}>{beast.description}</p><BestiaryTabs active={creature}/><section className={styles.panel}><h2>The record is unwritten</h2><p>No {beast.name.toLowerCase()} have been recorded here yet.</p></section><BackToBestiary /></div></main>;
}
