import styles from "@/components/direct-raven/direct-raven.module.css";

export default function ConversationLoading() {
  return (
    <section className={`${styles.thread} ${styles.threadLoading}`} aria-label="Opening correspondence" aria-busy="true">
      <div className={styles.threadLoadingHeader} />
      <div className={styles.threadLoadingMessages}>
        <span />
        <span />
        <span />
      </div>
      <div className={styles.threadLoadingComposer} />
    </section>
  );
}
