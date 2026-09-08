import cards from "@/data/the-great-game/cards.json";
import styles from "./artifacts.module.css";

export default function ArtifactsPage() { const artifacts = cards.filter((card) => card.cardType === "artifact"); return <main className={styles.page}><div className={styles.container}><p className={styles.eyebrow}>Relics of the Realm</p><h1>Artifacts</h1><p className={styles.lead}>Weapons, heirlooms, and objects whose names outlived their keepers.</p><div className={styles.grid}>{artifacts.map((artifact) => <article className={styles.card} key={artifact.id}><span className={styles.tier}>{artifact.tierId}</span><h2>{artifact.name}</h2><p>{artifact.subtitle}</p>{artifact.abilities?.[0] && <small>{artifact.abilities[0].text}</small>}</article>)}</div></div></main>; }
