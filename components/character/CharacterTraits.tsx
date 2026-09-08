import TraitBadge from "./TraitBadge";
import styles from "./characterContent.module.css";

type Props = {
  traits: string[];
};

export default function CharacterTraits({ traits }: Props) {
  if (!traits?.length) return null;

  return (
    <section className={styles.sectionPanel}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <span className={styles.sectionEyebrow}>Known qualities</span>
          <h2 className={styles.sectionTitle}>Traits</h2>
        </div>
        <p className={styles.sectionHint}>{traits.length} recorded</p>
      </div>

      <div className={styles.traitsGrid}>
        {traits.map((trait) => (
          <TraitBadge key={trait}>{trait}</TraitBadge>
        ))}
      </div>
    </section>
  );
}
