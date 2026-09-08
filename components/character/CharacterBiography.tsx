import styles from "./characterContent.module.css";

type Props = {
  summary: string;
};

export default function CharacterBiography({ summary }: Props) {
  return (
    <section className={styles.sectionPanel}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <span className={styles.sectionEyebrow}>Life &amp; standing</span>
          <h2 className={styles.sectionTitle}>Biography</h2>
        </div>
      </div>

      <p className={styles.biographyText}>{summary}</p>
    </section>
  );
}
