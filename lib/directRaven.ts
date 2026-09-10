import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import type { DirectRavenConversation, DirectRavenMessage, Profile } from "@/lib/supabase/database.types";

export type RavenConversationSummary = {
  conversation: DirectRavenConversation;
  partner: Profile;
  lastMessage: DirectRavenMessage | null;
  unread: number;
};

export async function loadDirectRavenInbox(): Promise<{ userId: string; profile: Profile; conversations: RavenConversationSummary[] } | null> {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  if (!user || !profile) return null;
  const supabase = await createClient();
  const { data: rows } = await supabase.from("direct_raven_conversations").select("*").order("updated_at", { ascending: false });
  const conversations = (rows ?? []) as DirectRavenConversation[];
  if (conversations.length === 0) return { userId: user.id, profile, conversations: [] };

  const partnerIds = [...new Set(conversations.map((c) => c.user_a === user.id ? c.user_b : c.user_a))];
  const ids = conversations.map((c) => c.id);
  const [{ data: profiles }, { data: messages }, { data: reads }] = await Promise.all([
    supabase.from("profiles").select("*").in("id", partnerIds),
    supabase.from("direct_raven_messages").select("*").in("conversation_id", ids).order("created_at", { ascending: false }),
    supabase.from("direct_raven_reads").select("*").in("conversation_id", ids).eq("user_id", user.id),
  ]);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));
  const allMessages = (messages ?? []) as DirectRavenMessage[];
  const readMap = new Map((reads ?? []).map((r) => [r.conversation_id, r.last_read_at as string]));

  return {
    userId: user.id,
    profile,
    conversations: conversations.flatMap((conversation) => {
      const partnerId = conversation.user_a === user.id ? conversation.user_b : conversation.user_a;
      const partner = profileMap.get(partnerId);
      if (!partner) return [];
      const ownMessages = allMessages.filter((m) => m.conversation_id === conversation.id);
      const lastRead = readMap.get(conversation.id);
      return [{
        conversation,
        partner,
        lastMessage: ownMessages[0] ?? null,
        unread: ownMessages.filter((m) => m.sender_id !== user.id && !m.deleted_at && (!lastRead || m.created_at > lastRead)).length,
      }];
    }),
  };
}

export async function loadDirectRavenConversation(id: string) {
  const inbox = await loadDirectRavenInbox();
  if (!inbox) return null;
  const summary = inbox.conversations.find((item) => item.conversation.id === id);
  if (!summary) return { ...inbox, selected: null, messages: [] as DirectRavenMessage[], blockedByMe: false, blockedByThem: false };
  const supabase = await createClient();
  const [{ data: messages }, { data: blocks }] = await Promise.all([
    supabase.from("direct_raven_messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }).limit(500),
    supabase.from("direct_raven_blocks").select("*").or(`and(blocker_id.eq.${inbox.userId},blocked_id.eq.${summary.partner.id}),and(blocker_id.eq.${summary.partner.id},blocked_id.eq.${inbox.userId})`),
  ]);
  const blockRows = (blocks ?? []) as { blocker_id: string; blocked_id: string }[];
  return {
    ...inbox,
    selected: summary,
    messages: (messages ?? []) as DirectRavenMessage[],
    blockedByMe: blockRows.some((b) => b.blocker_id === inbox.userId),
    blockedByThem: blockRows.some((b) => b.blocker_id === summary.partner.id),
  };
}
