import { redirect } from "next/navigation";
import DirectRavenInbox from "@/components/direct-raven/DirectRavenInbox";
import { loadDirectRavenInbox } from "@/lib/directRaven";
import styles from "@/components/direct-raven/direct-raven.module.css";

export default async function DirectRavenPage() {
  const inbox = await loadDirectRavenInbox();
  if (!inbox) redirect("/login?next=/messages");
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <DirectRavenInbox conversations={inbox.conversations} />
        <section className={styles.landing}>
          <div className={styles.ravenMark} aria-hidden="true">◆</div>
          <p className={styles.kicker}>The rookery is quiet</p>
          <h2>Select a correspondence</h2>
          <p>Direct Ravens are private between two members. Guild Parleys are visible only to their invited members.</p>
        </section>
      </div>
    </main>
  );
}
