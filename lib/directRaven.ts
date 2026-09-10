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
  const { data: rows, error: inboxError } = await supabase.from("direct_raven_conversations").select("*").order("updated_at", { ascending: false });
  if (inboxError) throw new Error("The raven inbox could not be loaded.");
  const conversations = (rows ?? []) as DirectRavenConversation[];
  if (conversations.length === 0) return { userId: user.id, profile, conversations: [] };

  const partnerIds = [...new Set(conversations.map((c) => c.user_a === user.id ? c.user_b : c.user_a))];
  const [{ data: profiles }, { data: summaries, error: summaryError }] = await Promise.all([
    supabase.from("profiles").select("*").in("id", partnerIds),
    supabase.rpc("direct_raven_summaries"),
  ]);
  if (summaryError) throw new Error("The raven inbox could not be loaded.");
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));
  const summaryMap = new Map((summaries as { conversation_id: string; last_message: DirectRavenMessage | null; unread: number }[] ?? []).map(s => [s.conversation_id, s]));

  return {
    userId: user.id,
    profile,
    conversations: conversations.flatMap((conversation) => {
      const partnerId = conversation.user_a === user.id ? conversation.user_b : conversation.user_a;
      const partner = profileMap.get(partnerId);
      if (!partner) return [];
      const summary = summaryMap.get(conversation.id);
      return [{
        conversation,
        partner,
        lastMessage: summary?.last_message ?? null,
        unread: Number(summary?.unread ?? 0),
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
  const [{ data: messages, error: messageError }, { data: blocks, error: blockError }] = await Promise.all([
    supabase.from("direct_raven_messages").select("*").eq("conversation_id", id).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(100),
    supabase.from("direct_raven_blocks").select("*").or(`and(blocker_id.eq.${inbox.userId},blocked_id.eq.${summary.partner.id}),and(blocker_id.eq.${summary.partner.id},blocked_id.eq.${inbox.userId})`),
  ]);
  if (messageError || blockError) throw new Error("The conversation could not be loaded.");
  const blockRows = (blocks ?? []) as { blocker_id: string; blocked_id: string }[];
  return {
    ...inbox,
    selected: summary,
    messages: ((messages ?? []) as DirectRavenMessage[]).reverse(),
    blockedByMe: blockRows.some((b) => b.blocker_id === inbox.userId),
    blockedByThem: blockRows.some((b) => b.blocker_id === summary.partner.id),
  };
}
