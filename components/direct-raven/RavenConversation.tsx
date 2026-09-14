"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import charactersData from "@/data/characters/characters.json";
import MiniPortrait from "@/components/MiniPortrait";
import { createClient } from "@/lib/supabase/client";
import type { DirectRavenConversation, DirectRavenMember, DirectRavenMessage, DirectRavenSystemEvent, Profile } from "@/lib/supabase/database.types";
import GiphyPicker, { type RavenGif } from "./GiphyPicker";
import EmojiPicker from "./EmojiPicker";
import MessageReactions from "./MessageReactions";
import GuildAvatar from "./GuildAvatar";
import GuildParleyInfo from "./GuildParleyInfo";
import RavenAttachment from "./RavenAttachment";
import RavenIcon from "./RavenIcon";
import RavenMessageContent, {
  encodeRavenBody,
  parseRavenBody,
  ravenBodySummary,
} from "./RavenMessageContent";
import styles from "./direct-raven.module.css";

const time = (value: string) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value));
const day = (value: string) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));

const MAX_PORTRAITS = 8;

type CharacterOption = {
  id: string;
  name: string;
  hidden?: boolean;
  fallbackSrc?: string;
};

const portraitCharacters: CharacterOption[] = [
  ...(charactersData as CharacterOption[]).filter((character) => !character.hidden),
  { id: "mara", name: "Mara", fallbackSrc: "/images/miniportraits/MaraMiniPortrait.webp" },
  { id: "aldren", name: "Aldren", fallbackSrc: "/images/miniportraits/AldrenMiniPortrait.webp" },
].sort((a, b) => a.name.localeCompare(b.name));

type PickerTab = "emoji" | "portraits";

type Props = {
  conversationId: string;
  conversation?: DirectRavenConversation;
  userId: string;
  partner: Profile | null;
  members?: Profile[];
  memberships?: DirectRavenMember[];
  initialMessages: DirectRavenMessage[];
  initialSystemEvents?: DirectRavenSystemEvent[];
  blockedByMe: boolean;
  blockedByThem: boolean;
  initialLastReadAt?: string | null;
  focusUnread?: boolean;
};

export default function RavenConversation({
  conversationId,
  conversation,
  userId,
  partner,
  members = [],
  memberships = [],
  initialMessages,
  initialSystemEvents = [],
  blockedByMe: initialBlockedByMe,
  blockedByThem: initialBlockedByThem,
  initialLastReadAt = null,
  focusUnread = false,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState(initialMessages);
  const [systemEvents, setSystemEvents] = useState(initialSystemEvents);
  const [gif,setGif]=useState<RavenGif|null>(null);
  const [gifOpen,setGifOpen]=useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<PickerTab>("emoji");
  const [portraitSearch, setPortraitSearch] = useState("");
  const [blockedByMe, setBlockedByMe] = useState(initialBlockedByMe);
  const [blockedByThem, setBlockedByThem] = useState(initialBlockedByThem);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [reply, setReply] = useState<DirectRavenMessage | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [hasOlder, setHasOlder] = useState(initialMessages.length === 100);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [partnerRead, setPartnerRead] = useState("");
  const [guildReads, setGuildReads] = useState<{ user_id: string; last_read_at: string }[]>([]);
  const [seenPanelId, setSeenPanelId] = useState<string | null>(null);
  const [newMessages, setNewMessages] = useState(false);
  const [guildInfoOpen, setGuildInfoOpen] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(!focusUnread);
  const loadedMessages = useRef(messages);
  const sendLock = useRef(false);

  const activeConversation: DirectRavenConversation = conversation ?? {
    id: conversationId, user_a: userId, user_b: partner?.id ?? null, kind: "raven", title: null, description: null, avatar_path: null, owner_id: null, created_at: "", updated_at: "",
  };
  const isGuild = activeConversation.kind === "guild";
  const memberMap = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const timeline = useMemo(() => [
    ...messages.map((message) => ({ type: "message" as const, at: message.created_at, id: message.id, message })),
    ...systemEvents.map((event) => ({ type: "system" as const, at: event.created_at, id: event.id, event })),
  ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id)), [messages, systemEvents]);
  const firstUnreadId = useMemo(() => messages.find((message) =>
    message.sender_id !== userId && !message.deleted_at && (!initialLastReadAt || message.created_at > initialLastReadAt)
  )?.id ?? null, [messages, userId, initialLastReadAt]);
  const unreadFocusDone = useRef(false);
  const systemEventText = (event: DirectRavenSystemEvent) => {
    const actor = typeof event.detail.actorName === "string" ? event.detail.actorName : memberMap.get(event.actor_id ?? "")?.display_name ?? "A member";
    const target = typeof event.detail.targetName === "string" ? event.detail.targetName : memberMap.get(event.target_user_id ?? "")?.display_name ?? "a member";
    if (event.event_type === "member_added") return `${actor} added ${target} to the parley.`;
    if (event.event_type === "member_removed") return `${actor} removed ${target} from the parley.`;
    const nextTitle = typeof event.detail.newTitle === "string" ? event.detail.newTitle : null;
    return nextTitle ? `${actor} changed the parley details · ${nextTitle}` : `${actor} changed the parley details.`;
  };
  const closed = !isGuild && (blockedByMe || blockedByThem);
  const filteredPortraits = useMemo(() => {
    const query = portraitSearch.trim().toLowerCase();
    if (!query) return portraitCharacters;
    return portraitCharacters.filter(
      (character) => character.name.toLowerCase().includes(query) || character.id.includes(query)
    );
  }, [portraitSearch]);

  useLayoutEffect(() => {
    const menu = actionMenuRef.current;
    const list = listRef.current;
    if (!actionMenuId || !menu || !list) return;
    const bounds = list.getBoundingClientRect();
    menu.style.top = "24px";
    menu.style.bottom = "auto";
    menu.style.left = "auto";
    menu.style.right = "0";
    const rect = menu.getBoundingClientRect();
    if (rect.left < bounds.left + 8) {
      menu.style.left = "0";
      menu.style.right = "auto";
    }
    const anchor = menu.parentElement!.getBoundingClientRect();
    if (rect.bottom > bounds.bottom - 8 && anchor.top - bounds.top > bounds.bottom - anchor.bottom) {
      menu.style.top = "auto";
      menu.style.bottom = "24px";
    }
    const close = () => setActionMenuId(null);
    list.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    return () => { list.removeEventListener("scroll", close); window.removeEventListener("resize", close); };
  }, [actionMenuId]);

  const scrollBottom = () => {
    const element = listRef.current;
    if (element) element.scrollTop = element.scrollHeight;
    nearBottom.current = true;
    setNewMessages(false);
  };

  const resetDraftExtras = () => {
    setPickerOpen(false);
    setPortraitSearch("");
  };

  const openPicker = (tab: PickerTab) => {
    const shouldClose = pickerOpen && pickerTab === tab;
    if (shouldClose) {
      setPickerOpen(false);
      return;
    }
    setGifOpen(false);
    setPickerTab(tab);
    setPickerOpen(true);
    inputRef.current?.blur();
  };

  useLayoutEffect(() => {
    loadedMessages.current = messages;
    if (nearBottom.current) scrollBottom();
  }, [messages]);

  useLayoutEffect(() => {
    if (!focusUnread || unreadFocusDone.current || !firstUnreadId) return;
    const target = document.getElementById(`raven-${firstUnreadId}`);
    if (!target) return;
    unreadFocusDone.current = true;
    target.scrollIntoView({ block: "center" });
    const element = listRef.current;
    if (element) nearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
  }, [focusUnread, firstUnreadId]);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    let raf = 0;

    const updateViewport = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const height = viewport?.height ?? window.innerHeight;
        const offset = viewport?.offsetTop ?? 0;
        const navBottom = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
        const visibleNav = Math.max(0, navBottom - offset);
        const root = document.documentElement;

        root.style.setProperty("--raven-mobile-top", `${offset + visibleNav}px`);
        root.style.setProperty("--raven-mobile-height", `${Math.max(0, height - visibleNav)}px`);
        root.style.setProperty("--direct-raven-viewport-height", `${height}px`);

        if (document.activeElement === inputRef.current && nearBottom.current) {
          scrollBottom();
        }
      });
    };

    updateViewport();
    viewport?.addEventListener("resize", updateViewport);
    viewport?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);

    return () => {
      cancelAnimationFrame(raf);
      viewport?.removeEventListener("resize", updateViewport);
      viewport?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
      document.documentElement.style.removeProperty("--direct-raven-viewport-height");
      document.documentElement.style.removeProperty("--raven-mobile-top");
      document.documentElement.style.removeProperty("--raven-mobile-height");
    };
  }, []);

  useEffect(() => {
    const closeMenu = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
      if (!(event.target as Element | null)?.closest?.('[data-raven-message-menu]')) setActionMenuId(null);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setActionMenuId(null);
        setPickerOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.activeRavenConversation = conversationId;
    return () => {
      if (document.documentElement.dataset.activeRavenConversation === conversationId) {
        delete document.documentElement.dataset.activeRavenConversation;
      }
    };
  }, [conversationId]);


  useEffect(() => {
    let active = true;

    const markNotificationRead = async (notificationId?: string) => {
      if (document.visibilityState !== "visible") return;
      const readAt = new Date().toISOString();
      let query = supabase
        .from("site_notifications")
        .update({ read_at: readAt })
        .eq("user_id", userId)
        .is("read_at", null);
      query = notificationId
        ? query.eq("id", notificationId)
        : query.contains("context", { conversationId });
      await query;
      window.dispatchEvent(new CustomEvent("asofab:notifications-changed"));
    };

    const markReadAt = async (at?: string) => {
      if (document.visibilityState !== "visible" || !nearBottom.current) return;
      const latest = loadedMessages.current.at(-1);
      const lastReadAt = at ?? latest?.created_at;
      if (!lastReadAt) return;
      const { error: readError } = await supabase.from("direct_raven_reads").upsert(
        { conversation_id: conversationId, user_id: userId, last_read_at: lastReadAt },
        { onConflict: "conversation_id,user_id" }
      );
      if (readError) return;
      await markNotificationRead();
      window.dispatchEvent(new CustomEvent("direct-raven-read", { detail: { conversationId } }));
    };

    const sync = async () => {
      if (document.visibilityState !== "visible") return;
      let query = supabase
        .from("direct_raven_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at");
      const oldest = loadedMessages.current[0];
      if (oldest) query = query.gte("created_at", oldest.created_at);

      const readPromise = !isGuild && partner
        ? supabase.from("direct_raven_reads").select("last_read_at").eq("conversation_id", conversationId).eq("user_id", partner.id).maybeSingle()
        : Promise.resolve({ data: null, error: null });
      const guildReadPromise = isGuild
        ? supabase.from("direct_raven_reads").select("user_id,last_read_at").eq("conversation_id", conversationId)
        : Promise.resolve({ data: [], error: null });
      const blockPromise = !isGuild && partner
        ? supabase.from("direct_raven_blocks").select("blocker_id,blocked_id").or(`and(blocker_id.eq.${userId},blocked_id.eq.${partner.id}),and(blocker_id.eq.${partner.id},blocked_id.eq.${userId})`)
        : Promise.resolve({ data: [], error: null });
      const [{ data }, { data: reads }, { data: guildReadRows }, { data: blocks }] = await Promise.all([query, readPromise, guildReadPromise, blockPromise]);

      if (!active) return;
      if (data) {
        const incoming = data as DirectRavenMessage[];
        if (!nearBottom.current && incoming.some((message) => !loadedMessages.current.some((old) => old.id === message.id))) setNewMessages(true);
        setMessages((current) => {
          const map = new Map<string, DirectRavenMessage>(current.map((message) => [message.id, message]));
          let changed = current.length !== incoming.length;
          for (const message of incoming) {
            const previous = map.get(message.id);
            if (!previous || previous.sender_id !== message.sender_id || previous.body !== message.body || previous.created_at !== message.created_at || previous.deleted_at !== message.deleted_at || previous.edited_at !== message.edited_at || previous.reply_to !== message.reply_to || previous.attachment_path !== message.attachment_path || previous.gif?.url !== message.gif?.url) changed = true;
            map.set(message.id, message);
          }
          if (!changed && current.length === incoming.length) return current;
          return [...map.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
        });
      }
      setPartnerRead(reads?.last_read_at ?? "");
      if (isGuild) setGuildReads((guildReadRows ?? []) as { user_id: string; last_read_at: string }[]);
      if (!isGuild && partner && blocks) {
        setBlockedByMe(blocks.some((block) => block.blocker_id === userId));
        setBlockedByThem(blocks.some((block) => block.blocker_id === partner.id));
      }
      void markReadAt();
    };

    if (!focusUnread || !firstUnreadId) scrollBottom();
    void sync();

    const channel = supabase
      .channel(`direct-raven:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_raven_messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const message = payload.new as DirectRavenMessage;
          setMessages((current) => current.some((entry) => entry.id === message.id)
            ? current.map((entry) => entry.id === message.id ? message : entry)
            : [...current, message].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)));
          if (nearBottom.current) {
            requestAnimationFrame(scrollBottom);
            void markReadAt(message.created_at);
          } else setNewMessages(true);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "direct_raven_messages", filter: `conversation_id=eq.${conversationId}` },
        () => void sync()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_raven_reads", filter: `conversation_id=eq.${conversationId}` },
        () => void sync()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "site_notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as { id?: string; context?: Record<string, unknown> };
          if (document.visibilityState === "visible" && row.context?.conversationId === conversationId) void markNotificationRead(row.id);
        }
      )
      .subscribe();

    const timer = setInterval(() => void sync(), 10000);
    const visible = () => { if (document.visibilityState === "visible") void sync(); };
    const read = () => { if (nearBottom.current) void markReadAt(); };

    document.addEventListener("visibilitychange", visible);
    const element = listRef.current;
    element?.addEventListener("scrollend", read);

    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      element?.removeEventListener("scrollend", read);
      void supabase.removeChannel(channel);
    };
  }, [conversationId, supabase, userId, partner, isGuild, focusUnread, firstUnreadId]);

  function chooseFile(next: File | undefined) {
    if (!next) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(next.type) || next.size > 8 * 1024 * 1024) {
      setError("Choose a JPEG, PNG, WebP or GIF up to 8 MB.");
      return;
    }
    setError("");
    setFile(next);
  }

  function addPortrait(id: string) {
    const parsed = parseRavenBody(body);
    if (parsed.portraitIds.length >= MAX_PORTRAITS) {
      setError(`You can insert up to ${MAX_PORTRAITS} mini portraits to one raven.`);
      return;
    }
    setError("");
    setBody(encodeRavenBody(parsed.text, [...parsed.portraitIds, id]));
  }

  function removeDraftPortrait(index: number) {
    const parsed = parseRavenBody(body);
    setBody(encodeRavenBody(parsed.text, parsed.portraitIds.filter((_, portraitIndex) => portraitIndex !== index)));
  }

  function beginEdit(message: DirectRavenMessage) {
    setGif(null);
    setGifOpen(false);
    setEditing(message.id);
    setBody(message.body);
    setReply(null);
    setFile(null);
    setPickerOpen(false);
    inputRef.current?.focus({ preventScroll: true });
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const encodedBody = body.trim();
    if ((!encodedBody && !file && !gif) || sendLock.current || closed) return;

    sendLock.current = true;
    setSending(true);
    setError("");
    let path: string | null = null;

    try {
      if (file && !editing) {
        const extension = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/gif": "gif",
        }[file.type];
        path = `${conversationId}/${userId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("raven-media")
          .upload(path, file, { contentType: file.type });
        if (uploadError) throw Error("The image could not be uploaded. Please try again.");
      }

      const query = editing
        ? supabase
            .from("direct_raven_messages")
            .update({ body: encodedBody })
            .eq("id", editing)
            .eq("sender_id", userId)
            .is("deleted_at", null)
        : supabase.from("direct_raven_messages").insert({
            conversation_id: conversationId,
            sender_id: userId,
            body: encodedBody,
            ...(gif ? {gif} : {}),
            ...(path ? { attachment_path: path } : {}),
            ...(reply ? { reply_to: reply.id } : {}),
          });

      const { data, error: sendError } = await query.select("*").single();
      if (sendError || !data) throw Error("The raven could not be sent. Your draft is still here.");
      nearBottom.current = true;
      setMessages((current) =>
        current.some((message) => message.id === data.id)
          ? current.map((message) => (message.id === data.id ? data : message))
          : [...current, data]
      );
      setBody("");
      setGif(null);
      setGifOpen(false);
      setFile(null);
      setReply(null);
      setEditing(null);
      resetDraftExtras();
      window.dispatchEvent(new CustomEvent("direct-raven-read", { detail: { conversationId } }));
      if (!editing) requestAnimationFrame(() => {
        void fetch("/api/notifications/direct-raven", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: data.id }),
        }).catch(() => {});
      });
    } catch (caught) {
      if (path) await supabase.storage.from("raven-media").remove([path]);
      setError(caught instanceof Error ? caught.message : "Could not send. Please try again.");
    } finally {
      sendLock.current = false;
      setSending(false);
    }
  }

  async function withdraw(message: DirectRavenMessage) {
    const { data, error: withdrawError } = await supabase
      .from("direct_raven_messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", message.id)
      .eq("sender_id", userId)
      .select("*")
      .single();

    if (withdrawError || !data) {
      setError("Could not withdraw this raven.");
      return;
    }
    setMessages((current) => current.map((item) => (item.id === message.id ? data : item)));
    if (editing === message.id) {
      setEditing(null);
      setBody("");
      resetDraftExtras();
    }
  }

  async function toggleBlock() {
    if (!partner || isGuild) return;
    const { error: blockError } = blockedByMe
      ? await supabase.from("direct_raven_blocks").delete().eq("blocker_id", userId).eq("blocked_id", partner.id)
      : await supabase.from("direct_raven_blocks").insert({ blocker_id: userId, blocked_id: partner.id });

    if (blockError) setError("Could not update this raven path.");
    else {
      setBlockedByMe(!blockedByMe);
      setMenuOpen(false);
    }
  }

  async function older() {
    if (loadingOlder || !messages[0]) return;
    setLoadingOlder(true);
    const element = listRef.current;
    const before = element?.scrollHeight ?? 0;
    const { data, error: olderError } = await supabase
      .from("direct_raven_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .lt("created_at", messages[0].created_at)
      .order("created_at", { ascending: false })
      .limit(100);

    if (olderError) setError("Could not load older ravens.");
    else {
      nearBottom.current = false;
      setHasOlder(data.length === 100);
      setMessages((current) => [...(data as DirectRavenMessage[]).reverse(), ...current]);
      requestAnimationFrame(() => {
        if (element) element.scrollTop += element.scrollHeight - before;
      });
    }
    setLoadingOlder(false);
  }

  const threadTitle = isGuild ? (activeConversation.title ?? "Guild Parley") : (partner?.display_name ?? "Direct Raven");

  const seenFor = (message: DirectRavenMessage) => {
    if (!isGuild || message.sender_id !== userId) return [];
    const eligible = new Set(
      memberships
        .filter((membership) => membership.user_id !== userId && membership.joined_at <= message.created_at)
        .map((membership) => membership.user_id)
    );
    return guildReads
      .filter((receipt) => eligible.has(receipt.user_id) && receipt.last_read_at >= message.created_at)
      .sort((a, b) => a.last_read_at.localeCompare(b.last_read_at));
  };

  const eligibleCountFor = (message: DirectRavenMessage) =>
    memberships.filter((membership) => membership.user_id !== userId && membership.joined_at <= message.created_at).length;


  useEffect(() => {
    if (!isGuild) return;
    const channel = supabase.channel(`direct-raven-system:${conversationId}`).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "direct_raven_system_events", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const event = payload.new as DirectRavenSystemEvent;
        setSystemEvents((current) => current.some((item) => item.id === event.id) ? current : [...current, event]);
      },
    ).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [conversationId, isGuild, supabase]);

  const seenPanelMessage = seenPanelId ? messages.find((message) => message.id === seenPanelId) ?? null : null;
  const seenPanelRows = seenPanelMessage ? seenFor(seenPanelMessage) : [];

  return (
    <section className={styles.thread} aria-label={isGuild ? `Guild Parley: ${threadTitle}` : `Conversation with ${threadTitle}`}>
      <header className={styles.threadHeader}>
        <Link href="/messages" className={styles.backInbox} aria-label="Back to inbox"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m10 6-6 6 6 6M4 12h16" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
        {isGuild ? (
          <button type="button" className={`${styles.partnerIdentity} ${styles.guildIdentityButton}`} onClick={() => setGuildInfoOpen(true)}>
            <GuildAvatar path={activeConversation.avatar_path} name={threadTitle} />
            <span><b>{threadTitle}</b><small>Guild Parley · {members.length} members</small></span>
          </button>
        ) : partner ? (
          <Link href={`/users/${partner.username}`} className={styles.partnerIdentity}>
            <span className={styles.avatar}>{partner.avatar_url ? <img src={partner.avatar_url} alt="" /> : partner.display_name.slice(0, 2).toUpperCase()}</span>
            <span><b>{partner.display_name}</b><small>@{partner.username}</small></span>
          </Link>
        ) : null}
        <div className={styles.threadMenuWrap} ref={menuRef}>
          <button type="button" className={styles.threadMenuButton} onClick={() => setMenuOpen((current) => !current)} aria-expanded={menuOpen} aria-label="Conversation options"><svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg></button>
          {menuOpen && (
            <div className={styles.threadMenu}>
              {isGuild ? (
                <button type="button" onClick={() => { setMenuOpen(false); setGuildInfoOpen(true); }}>Guild info</button>
              ) : (
                <button type="button" onClick={() => void toggleBlock()}>{blockedByMe ? "Unblock user" : "Block user"}</button>
              )}
            </div>
          )}
        </div>
      </header>

      {isGuild && (
        <GuildParleyInfo open={guildInfoOpen} onClose={() => setGuildInfoOpen(false)} conversation={activeConversation} members={members} memberships={memberships} userId={userId} />
      )}

      <div
        className={styles.messages}
        ref={listRef}
        onScroll={(event) => {
          const element = event.currentTarget;
          nearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
          if (nearBottom.current) setNewMessages(false);
        }}
      >
        {hasOlder && (
          <button className={styles.olderButton} disabled={loadingOlder} onClick={() => void older()}>
            {loadingOlder ? "Loading…" : "Load earlier ravens"}
          </button>
        )}

        {!timeline.length && (
          <div className={styles.emptyThread}>
            <RavenIcon size={64} />
            <h2>{isGuild ? "The hall is gathered." : "A clear sky between two keeps."}</h2>
            <p>{isGuild ? `Begin the first parley in ${threadTitle}.` : `Send the first raven to ${partner?.display_name ?? "this member"}.`}</p>
          </div>
        )}

        {timeline.map((item, index) => {
          const previousAt = index > 0 ? timeline[index - 1].at : null;
          if (item.type === "system") return (
            <div key={`system-${item.id}`}>
              {(!previousAt || day(item.at) !== day(previousAt)) && <div className={styles.dateDivider}>{day(item.at)}</div>}
              <div className={styles.systemEvent}><span aria-hidden="true">✦</span><p>{systemEventText(item.event)}</p><time dateTime={item.at}>{time(item.at)}</time></div>
            </div>
          );
          const message = item.message;
          const mine = message.sender_id === userId;
          const parent = messages.find((entry) => entry.id === message.reply_to);
          return (
            <div key={message.id}>
              {(!previousAt || day(message.created_at) !== day(previousAt)) && (
                <div className={styles.dateDivider}>{day(message.created_at)}</div>
              )}
              {message.id === firstUnreadId && <div className={styles.unreadDivider}><span>Unread ravens</span></div>}
              <div id={`raven-${message.id}`} className={`${styles.messageRow} ${mine ? styles.mine : styles.theirs}`}>
                {isGuild && !mine && (() => {
                  const sender = memberMap.get(message.sender_id);
                  const avatar = (
                    <span className={styles.guildMessageAvatar} aria-hidden="true">
                      {sender?.avatar_url
                        ? <img src={sender.avatar_url} alt="" />
                        : (sender?.display_name ?? "Guild member").slice(0, 2).toUpperCase()}
                    </span>
                  );
                  return sender?.username
                    ? <Link className={styles.guildMessageAvatarLink} href={`/users/${sender.username}`} aria-label={`Open ${sender.display_name}'s profile`}>{avatar}</Link>
                    : avatar;
                })()}
                <div className={`${styles.messageBubble} ${message.deleted_at ? styles.deletedMessage : ""}`}>
                  {isGuild && !mine && !message.deleted_at && <span className={styles.guildSenderName}>{memberMap.get(message.sender_id)?.display_name ?? "Guild member"}</span>}
                  {!message.deleted_at && message.reply_to && (
                    <div className={styles.replyQuote}>
                      {parent
                        ? parent.deleted_at
                          ? "Withdrawn raven"
                          : ravenBodySummary(parent.body || "") || (parent.attachment_path ? "Photo" : "Raven")
                        : "Reply to an earlier raven"}
                    </div>
                  )}
                  {!message.deleted_at && message.attachment_path && (
                    <RavenAttachment
                      path={message.attachment_path}
                      onLoad={() => {
                        if (nearBottom.current) scrollBottom();
                      }}
                    />
                  )}
                  {!message.deleted_at && message.gif && /^https:\/\/media[0-9]*\.giphy\.com\/media\//.test(message.gif.url) && <div className={styles.attachment}><img src={message.gif.url} alt={message.gif.title||"GIPHY GIF"} onLoad={()=>{if(nearBottom.current)scrollBottom();}}/><small>GIPHY</small></div>}
                  {message.deleted_at ? <p>This raven was withdrawn.</p> : <RavenMessageContent body={message.body} />}
                  <div className={styles.messageFooter}>
                    {!message.deleted_at && <div className={styles.messageActions}>
                      <MessageReactions messageId={message.id} userId={userId} />
                      {!closed && <button type="button" onClick={() => { setReply(message); setEditing(null); inputRef.current?.focus({ preventScroll: true }); }}>Reply</button>}
                    </div>}
                    <span className={styles.messageMeta}>
                      <time dateTime={message.created_at}>{time(message.created_at)}</time>
                      {message.edited_at && !message.deleted_at ? " · edited" : ""}
                      {mine && !message.deleted_at && !isGuild ? (partnerRead >= message.created_at ? " · Seen" : " · Sent") : ""}
                      {mine && !message.deleted_at && isGuild && (() => {
                        const seen = seenFor(message);
                        const eligible = eligibleCountFor(message);
                        if (seen.length === 0) return " · Sent";
                        return (
                          <>
                            {" · "}
                            <button
                              type="button"
                              className={styles.seenByButton}
                              onClick={() => setSeenPanelId(message.id)}
                              aria-label="Show who has seen this message"
                            >
                              {eligible > 0 && seen.length === eligible ? "Seen by all" : `Seen by ${seen.length}`}
                            </button>
                          </>
                        );
                      })()}
                    </span>
                  </div>
                  {!message.deleted_at && (
                    <>
                      <div className={styles.messageCornerMenu} data-raven-message-menu>
                        <button
                          type="button"
                          className={styles.messageMenuButton}
                          aria-label="Message options"
                          aria-expanded={actionMenuId === message.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            setActionMenuId((current) => current === message.id ? null : message.id);
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                        {actionMenuId === message.id && (
                          <div ref={actionMenuRef} className={styles.messageMenu} onPointerDown={(event) => event.stopPropagation()}>
                            {parseRavenBody(message.body).text && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuId(null);
                                  void navigator.clipboard
                                    .writeText(parseRavenBody(message.body).text)
                                    .catch(() => setError("Could not copy text."));
                                }}
                              >
                                Copy
                              </button>
                            )}
                            {mine && (
                              <>
                                <button type="button" disabled={closed} onClick={() => { setActionMenuId(null); beginEdit(message); }}>Edit</button>
                                <button type="button" className={styles.destructiveMenuItem} onClick={() => { setActionMenuId(null); void withdraw(message); }}>Withdraw</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.composerArea}>
        {newMessages && <button className={styles.olderButton} onClick={scrollBottom}>New ravens <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v13m-5-5 5 5 5-5" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" /></svg></button>}
        {closed ? (
          <div className={styles.closedNotice}>
            {blockedByMe ? "You closed this raven path. Unblock this user to send again." : "This raven path is closed."}
          </div>
        ) : (
          <>
            {(reply || editing) && (
              <div className={styles.draftContext}>
                <span>{editing ? "Editing raven" : `Replying: ${reply ? ravenBodySummary(reply.body) : "Raven"}`}</span>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => {
                    setReply(null);
                    if (editing) setBody("");
                    setEditing(null);
                    resetDraftExtras();
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {gifOpen && <div className={styles.gifPopover}><GiphyPicker onSelect={value=>{setGif(value);setGifOpen(false);}}/></div>}
            {gif && <div className={styles.mediaPreview}><img src={gif.url} alt={gif.title}/><button type="button" disabled={sending} onClick={()=>setGif(null)}>Remove GIF</button></div>}
            {preview && (
              <div className={styles.mediaPreview}>
                <img src={preview} alt="Attachment preview" />
                <button type="button" disabled={sending} onClick={() => setFile(null)}>Remove image</button>
              </div>
            )}

            {pickerOpen && (
              <div className={`${styles.reactionPicker} ${pickerTab === "portraits" ? styles.portraitPopover : styles.emojiPopover}`} aria-label={pickerTab === "portraits" ? "Mini portraits" : "Emoji"}>
                {pickerTab === "emoji" ? (
                  <EmojiPicker onSelect={(emoji) => setBody((value) => encodeRavenBody((parseRavenBody(value).text + emoji).slice(0, 4000), parseRavenBody(value).portraitIds))} />
                ) : (
                  <div className={styles.portraitPicker}>
                    <input
                      type="search"
                      value={portraitSearch}
                      onChange={(event) => setPortraitSearch(event.target.value)}
                      placeholder="Find a character…"
                      aria-label="Find a mini portrait"
                    />
                    <div className={styles.portraitGrid}>
                      {filteredPortraits.map((character) => (
                        <button
                          key={character.id}
                          type="button"
                          disabled={sending || parseRavenBody(body).portraitIds.length >= MAX_PORTRAITS}
                          onClick={() => addPortrait(character.id)}
                          title={character.name}
                          aria-label={`Add ${character.name} mini portrait`}
                        >
                          <MiniPortrait id={character.id} alt="" size={44} fallbackSrc={character.fallbackSrc} />
                          <span>{character.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <form className={styles.composer} onSubmit={send}>
              <div className={styles.richComposerInput}>
                {parseRavenBody(body).portraitIds.length > 0 && <div className={styles.draftPortraits} aria-label="Mini portraits in this raven">
                  {parseRavenBody(body).portraitIds.map((id, index) => {
                    const option = portraitCharacters.find((character) => character.id === id);
                    return <span key={`${id}-${index}`} className={styles.draftPortrait}>
                      <MiniPortrait id={id} alt={option?.name ?? id} size={28} fallbackSrc={option?.fallbackSrc} />
                      <button type="button" aria-label={`Remove ${option?.name ?? "mini portrait"}`} onClick={() => removeDraftPortrait(index)} disabled={sending}>
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                      </button>
                    </span>;
                  })}
                </div>}
              <textarea
                ref={inputRef}
                disabled={sending}
                value={parseRavenBody(body).text}
                onChange={(event) => setBody(encodeRavenBody(event.target.value, parseRavenBody(body).portraitIds))}
                maxLength={4000}
                rows={2}
                placeholder={isGuild ? "Write to the Guild Parley…" : "Write your raven…"}
                aria-label="Message"
                onFocus={() => {
                  setPickerOpen(false);
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      if (nearBottom.current) scrollBottom();
                    });
                  });
                  window.setTimeout(() => {
                    if (nearBottom.current) scrollBottom();
                  }, 120);
                }}
                onPaste={(event) => {
                  if (!editing) {
                    const image = Array.from(event.clipboardData.files).find((candidate) => candidate.type.startsWith("image/"));
                    if (image) {
                      event.preventDefault();
                      chooseFile(image);
                    }
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              </div>
              <button
                type="submit"
                disabled={sending || (!body.trim() && !file && !gif)}
              >
                <RavenIcon size={18} /> {sending ? "Sending…" : editing ? "Save" : "Send"}
              </button>
            </form>

            <div className={styles.composerTools}>
              <button type="button" disabled={sending||!!editing} onClick={()=>{setGifOpen(v=>!v);setPickerOpen(false);inputRef.current?.blur();}} aria-expanded={gifOpen}>GIF</button>
              <label className={styles.fileButton} aria-disabled={!!editing || sending}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" /></svg> Photo / GIF
                <input
                  type="file"
                  disabled={!!editing || sending}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => {
                    chooseFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
              <button type="button" disabled={sending} onClick={() => openPicker("emoji")} aria-expanded={pickerOpen}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M9 10h.01M15 10h.01M8.5 14c1 1.4 2.1 2 3.5 2s2.5-.6 3.5-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> Emoji
              </button>
              <button type="button" disabled={sending} onClick={() => openPicker("portraits")} aria-expanded={pickerOpen}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.4"/><path d="M8.5 16c.9-1.6 2.1-2.4 3.5-2.4s2.6.8 3.5 2.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> Portraits
              </button>
              <small>Shift + Enter for a new line</small>
            </div>
          </>
        )}
        {error && <p role="alert" className={styles.error}>{error}</p>}
      </div>

      {seenPanelMessage && (
        <div className={styles.seenOverlay} role="presentation" onPointerDown={() => setSeenPanelId(null)}>
          <section className={styles.seenPanel} role="dialog" aria-modal="true" aria-label="Message read receipts" onPointerDown={(event) => event.stopPropagation()}>
            <div className={styles.seenPanelHeader}>
              <div>
                <p className={styles.kicker}>Guild Parley</p>
                <h3>{eligibleCountFor(seenPanelMessage) > 0 && seenPanelRows.length === eligibleCountFor(seenPanelMessage) ? "Seen by all" : `Seen by ${seenPanelRows.length}`}</h3>
              </div>
              <button type="button" className={styles.seenPanelClose} aria-label="Close read receipts" onClick={() => setSeenPanelId(null)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round"/></svg></button>
            </div>
            <div className={styles.seenList}>
              {seenPanelRows.length === 0 && <p className={styles.seenEmpty}>No one else has seen this raven yet.</p>}
              {seenPanelRows.map((receipt) => {
                const member = memberMap.get(receipt.user_id);
                if (!member) return null;
                return (
                  <Link key={receipt.user_id} href={`/users/${member.username}`} className={styles.seenRow}>
                    <span className={styles.seenAvatar}>{member.avatar_url ? <img src={member.avatar_url} alt="" /> : member.display_name.slice(0, 2).toUpperCase()}</span>
                    <span className={styles.seenIdentity}><b>{member.display_name}</b><small>@{member.username}</small></span>
                    <time dateTime={receipt.last_read_at}>{time(receipt.last_read_at)}</time>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
