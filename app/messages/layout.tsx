import { redirect } from "next/navigation";
import DirectRavenInbox from "@/components/direct-raven/DirectRavenInbox";
import { loadDirectRavenInbox } from "@/lib/directRaven";
import styles from "@/components/direct-raven/direct-raven.module.css";

import type { ReactNode } from "react";

export default async function MessagesLayout({ children }: { children: ReactNode }) {
  const inbox = await loadDirectRavenInbox();
  if (!inbox) redirect("/login?next=/messages");

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <DirectRavenInbox conversations={inbox.conversations} />
        {children}
      </div>
    </main>
  );
}
