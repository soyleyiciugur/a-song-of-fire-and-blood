import styles from "@/components/direct-raven/direct-raven.module.css";

export default function DirectRavenPage() {
  return (
    <section className={styles.landing}>
      <div className={styles.ravenMark} aria-hidden="true">◆</div>
      <p className={styles.kicker}>The rookery is quiet</p>
      <h2>Select a correspondence</h2>
      <p>Private ravens are visible only to the two members of a conversation.</p>
    </section>
  );
}
