import Link from "next/link";
import { getCharacters } from "@/lib/characters";
import MiniPortrait from "@/components/MiniPortrait";
import type { CharacterId } from "@/types/character";
import styles from "./succession.module.css";

const ids = ["visenor-targaryen", "gaelor-targaryen", "jacaelon-targaryen", "saera-targaryen", "maela-targaryen", "vhaemys-targaryen"];
export default function SuccessionPage() { const byId = new Map(getCharacters().map((c) => [c.id, c])); return <main className={styles.page}><div className={styles.container}><p className={styles.eyebrow}>The Crown&apos;s Question</p><h1>Succession</h1><p className={styles.lead}>Blood, legitimacy, and the line that may inherit the Iron Throne.</p><div className={styles.line}>{ids.map((id, index) => { const character = byId.get(id as CharacterId); if (!character) return null; return <Link href={`/characters/${id}`} className={styles.heir} key={id}><span className={styles.number}>{index + 1}</span><MiniPortrait id={id as CharacterId} alt={character.name} size={64}/><div><h2>{character.name}</h2><p>{character.title}</p></div></Link>; })}</div></div></main>; }
