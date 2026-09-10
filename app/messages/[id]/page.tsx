import { notFound, redirect } from "next/navigation";
import DirectRavenInbox from "@/components/direct-raven/DirectRavenInbox";
import RavenConversation from "@/components/direct-raven/RavenConversation";
import { loadDirectRavenConversation } from "@/lib/directRaven";
import styles from "@/components/direct-raven/direct-raven.module.css";

export default async function DirectRavenConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadDirectRavenConversation(id);
  if (!data) redirect(`/login?next=${encodeURIComponent(`/messages/${id}`)}`);
  if (!data.selected) notFound();
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <DirectRavenInbox conversations={data.conversations} selectedId={id} />
        <RavenConversation conversationId={id} userId={data.userId} partner={data.selected.partner} initialMessages={data.messages} blockedByMe={data.blockedByMe} blockedByThem={data.blockedByThem} />
      </div>
    </main>
  );
}
