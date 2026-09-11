import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import type { DirectRavenConversation, DirectRavenMember, DirectRavenMessage, Profile } from "@/lib/supabase/database.types";

export type RavenConversationSummary = {
  conversation: DirectRavenConversation;
  partner: Profile | null;
  members: Profile[];
  memberships: DirectRavenMember[];
  lastMessage: DirectRavenMessage | null;
  unread: number;
};

export async function loadDirectRavenInbox(): Promise<{ userId: string; profile: Profile; conversations: RavenConversationSummary[] } | null> {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  if (!user || !profile) return null;

  const supabase = await createClient();
  const { data: rows, error: inboxError } = await supabase
    .from("direct_raven_conversations")
    .select("*")
    .order("updated_at", { ascending: false });
  if (inboxError) throw new Error("The raven inbox could not be loaded.");

  const conversations = (rows ?? []) as DirectRavenConversation[];
  if (conversations.length === 0) return { userId: user.id, profile, conversations: [] };

  const ids = conversations.map((conversation) => conversation.id);
  const [{ data: memberRows, error: memberError }, { data: summaries, error: summaryError }] = await Promise.all([
    supabase.from("direct_raven_members").select("*").in("conversation_id", ids),
    supabase.rpc("direct_raven_summaries"),
  ]);
  if (memberError || summaryError) throw new Error("The raven inbox could not be loaded.");

  const memberships = (memberRows ?? []) as DirectRavenMember[];
  const profileIds = [...new Set(memberships.map((membership) => membership.user_id))];
  const { data: profiles, error: profileError } = profileIds.length
    ? await supabase.from("profiles").select("*").in("id", profileIds)
    : { data: [], error: null };
  if (profileError) throw new Error("The raven inbox could not be loaded.");

  const profileMap = new Map((profiles ?? []).map((member) => [member.id, member as Profile]));
  const summaryMap = new Map(
    ((summaries as { conversation_id: string; last_message: DirectRavenMessage | null; unread: number }[]) ?? []).map((summary) => [
      summary.conversation_id,
      summary,
    ])
  );

  return {
    userId: user.id,
    profile,
    conversations: conversations.map((conversation) => {
      const conversationMemberships = memberships.filter((membership) => membership.conversation_id === conversation.id);
      const members = conversationMemberships.flatMap((membership) => {
        const member = profileMap.get(membership.user_id);
        return member ? [member] : [];
      });
      const partnerId = conversation.kind === "raven"
        ? (conversation.user_a === user.id ? conversation.user_b : conversation.user_a)
        : null;
      const partner = partnerId ? profileMap.get(partnerId) ?? null : null;
      const summary = summaryMap.get(conversation.id);

      return {
        conversation,
        partner,
        members,
        memberships: conversationMemberships,
        lastMessage: summary?.last_message ?? null,
        unread: Number(summary?.unread ?? 0),
      };
    }),
  };
}

// Lightweight route loader used after the persistent /messages layout has loaded the inbox.
// It deliberately does not call loadDirectRavenInbox(), so changing chats only fetches the
// selected conversation's members, profiles, messages and block state.
export async function loadDirectRavenConversationOnly(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: conversation, error: conversationError } = await supabase
    .from("direct_raven_conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (conversationError) throw new Error("The conversation could not be loaded.");
  if (!conversation) {
    return { userId: user.id, selected: null, messages: [] as DirectRavenMessage[], blockedByMe: false, blockedByThem: false };
  }

  const row = conversation as DirectRavenConversation;
  const { data: memberRows, error: memberError } = await supabase
    .from("direct_raven_members")
    .select("*")
    .eq("conversation_id", id);
  if (memberError) throw new Error("The conversation could not be loaded.");

  const memberships = (memberRows ?? []) as DirectRavenMember[];
  if (!memberships.some((membership) => membership.user_id === user.id)) {
    return { userId: user.id, selected: null, messages: [] as DirectRavenMessage[], blockedByMe: false, blockedByThem: false };
  }

  const memberIds = memberships.map((membership) => membership.user_id);
  const messagePromise = supabase
    .from("direct_raven_messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(100);

  const profilePromise = memberIds.length
    ? supabase.from("profiles").select("*").in("id", memberIds)
    : Promise.resolve({ data: [], error: null });

  const partnerId = row.kind === "raven"
    ? (row.user_a === user.id ? row.user_b : row.user_a)
    : null;
  const blockPromise = row.kind === "raven" && partnerId
    ? supabase
        .from("direct_raven_blocks")
        .select("blocker_id,blocked_id")
        .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${partnerId}),and(blocker_id.eq.${partnerId},blocked_id.eq.${user.id})`)
    : Promise.resolve({ data: [], error: null });

  const [
    { data: messages, error: messageError },
    { data: profiles, error: profileError },
    { data: blocks, error: blockError },
  ] = await Promise.all([messagePromise, profilePromise, blockPromise]);

  if (messageError || profileError || blockError) throw new Error("The conversation could not be loaded.");

  const members = (profiles ?? []) as Profile[];
  const profileMap = new Map(members.map((member) => [member.id, member]));
  const partner = partnerId ? profileMap.get(partnerId) ?? null : null;
  if (row.kind === "raven" && !partner) {
    return { userId: user.id, selected: null, messages: [] as DirectRavenMessage[], blockedByMe: false, blockedByThem: false };
  }

  const blockRows = (blocks ?? []) as { blocker_id: string; blocked_id: string }[];
  return {
    userId: user.id,
    selected: {
      conversation: row,
      partner,
      members,
      memberships,
      lastMessage: null,
      unread: 0,
    } satisfies RavenConversationSummary,
    // Nothing is deleted here: load the newest 100 and let RavenConversation fetch older pages.
    messages: ((messages ?? []) as DirectRavenMessage[]).reverse(),
    blockedByMe: partner ? blockRows.some((block) => block.blocker_id === user.id) : false,
    blockedByThem: partner ? blockRows.some((block) => block.blocker_id === partner.id) : false,
  };
}
