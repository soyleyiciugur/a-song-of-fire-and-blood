import { notFound, redirect } from "next/navigation";
import RavenConversation from "@/components/direct-raven/RavenConversation";
import { loadDirectRavenConversationOnly } from "@/lib/directRaven";

export default async function DirectRavenConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadDirectRavenConversationOnly(id);
  if (!data) redirect(`/login?next=${encodeURIComponent(`/messages/${id}`)}`);
  if (!data.selected) notFound();

  return (
    <RavenConversation
      key={id}
      conversationId={id}
      conversation={data.selected.conversation}
      userId={data.userId}
      partner={data.selected.partner}
      members={data.selected.members}
      memberships={data.selected.memberships}
      initialMessages={data.messages}
      blockedByMe={data.blockedByMe}
      blockedByThem={data.blockedByThem}
    />
  );
}
