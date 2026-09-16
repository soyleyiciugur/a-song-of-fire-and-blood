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
  parseRavenBody,
  ravenBodySummary,
} from "./RavenMessageContent";
import styles from "./direct-raven.module.css";

const time = (value: string) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value));
const day = (value: string) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));

const MAX_PORTRAITS = 8;

type RavenQuoteKind = "image" | "gif" | "reel" | "page" | "portrait" | "raven";

function quoteDescriptor(message: DirectRavenMessage) {
  const body = message.body || "";
  const visible = body
    .replace(/\[\[(?:portrait|reel):[a-z0-9-]+\]\]/gi, " ")
    .replace(/\[\[page:[A-Za-z0-9_-]+\]\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (visible) return { label: visible, kind: null as RavenQuoteKind | null };
  if (message.attachment_path) return { label: "Image", kind: "image" as const };
  if (message.gif) return { label: "GIF", kind: "gif" as const };
  if (/\[\[reel:/i.test(body)) return { label: ravenBodySummary(body), kind: "reel" as const };
  if (/\[\[page:/i.test(body)) return { label: ravenBodySummary(body), kind: "page" as const };
  const portraits = parseRavenBody(body, true).portraitIds.length;
  if (portraits) return { label: portraits === 1 ? "Portrait" : `${portraits} portraits`, kind: "portrait" as const };
  return { label: ravenBodySummary(body) || "Raven", kind: "raven" as const };
}

function QuoteGlyph({ kind }: { kind: RavenQuoteKind }) {
  if (kind === "image") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m6.5 17 4.2-4 2.5 2.2 2.2-2 2.2 3.8"/></svg>;
  if (kind === "gif") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M7.5 10.2c-.4-.5-1-.8-1.7-.8-1.3 0-2.2 1-2.2 2.6s.9 2.6 2.3 2.6c.7 0 1.2-.2 1.7-.6v-1.5H6.1M10 9.5v5M13 14.5v-5h3M13 12h2.5"/></svg>;
  if (kind === "reel") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m10 8 6 4-6 4V8Z"/></svg>;
  if (kind === "page") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h8l4 4V20H6V3.5Z"/><path d="M14 3.8V8h4M9 12h6M9 15.5h4.5"/></svg>;
  if (kind === "portrait") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2"/><circle cx="12" cy="10" r="2.2"/><path d="M8.5 16c.9-1.6 2.1-2.4 3.5-2.4s2.6.8 3.5 2.4"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18.5c4.2-1 8.7-4.6 12.8-11.5-1.1 5.6-4.6 10.5-9.8 12.5"/><path d="M8 15c2.4-.4 4.7-1.7 6.7-3.7"/></svg>;
}

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
  focusMessageId?: string | null;
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
  focusMessageId = null,
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
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const photoLibraryRef = useRef<HTMLInputElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<{ id: string; startX: number; startY: number; lastX: number; row: HTMLDivElement; horizontal: boolean } | null>(null);
  const nearBottom = useRef(false);
  const loadedMessages = useRef(messages);
  const sendLock = useRef(false);
  const openedReadDone = useRef(false);
  const messageHoldTimerRef = useRef<number | null>(null);
  const messageHoldStartRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const keyboardWasOpenRef = useRef(false);
  const restoreBottomAfterKeyboardRef = useRef(false);

  const activeConversation: DirectRavenConversation = conversation ?? {
    id: conversationId, user_a: userId, user_b: partner?.id ?? null, kind: "raven", title: null, description: null, avatar_path: null, owner_id: null, created_at: "", updated_at: "",
  };
  const isGuild = activeConversation.kind === "guild";
  const memberMap = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const timeline = useMemo(() => [
    ...messages.map((message) => ({ type: "message" as const, at: message.created_at, id: message.id, message })),
    ...systemEvents.map((event) => ({ type: "system" as const, at: event.created_at, id: event.id, event })),
  ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id)), [messages, systemEvents]);
  const unreadMessages = useMemo(() => initialMessages.filter((message) =>
    message.sender_id !== userId && !message.deleted_at && (!initialLastReadAt || message.created_at > initialLastReadAt)
  ), [initialMessages, userId, initialLastReadAt]);
  const firstUnreadId = unreadMessages[0]?.id ?? null;
  const unreadCount = unreadMessages.length;
  const initialPositionDone = useRef(false);
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

  const insertComposerText = (text: string, refocus = true) => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? body.length;
    const end = input?.selectionEnd ?? start;
    const next = `${body.slice(0, start)}${text}${body.slice(end)}`.slice(0, 4000);
    setBody(next);
    requestAnimationFrame(() => {
      const caret = Math.min(start + text.length, next.length);
      if (refocus) inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.setSelectionRange(caret, caret);
    });
  };

  const openPicker = (tab: PickerTab) => {
    const shouldClose = pickerOpen && pickerTab === tab;
    if (shouldClose) {
      setPickerOpen(false);
      return;
    }
    setGifOpen(false);
    setAttachmentMenuOpen(false);
    setPickerTab(tab);
    setPickerOpen(true);
    inputRef.current?.blur();
  };

  useLayoutEffect(() => {
    loadedMessages.current = messages;
    if (nearBottom.current) scrollBottom();
  }, [messages]);

  useLayoutEffect(() => {
    if (initialPositionDone.current) return;
    const element = listRef.current;
    if (!element) return;

    if (focusMessageId) {
      const target = document.getElementById(`raven-${focusMessageId}`);
      if (!target) return;
      initialPositionDone.current = true;
      target.scrollIntoView({ block: "center" });
      nearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
      return;
    }

    if (firstUnreadId) {
      const divider = document.getElementById("raven-unread-divider");
      if (!divider) return;
      initialPositionDone.current = true;
      const targetTop = divider.offsetTop - element.clientHeight * 0.22;
      element.scrollTop = Math.max(0, targetTop);
      nearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
      return;
    }

    initialPositionDone.current = true;
    element.scrollTop = element.scrollHeight;
    nearBottom.current = true;
  }, [focusMessageId, firstUnreadId]);

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
        const keyboardOpen = height < window.innerHeight - 100;
        root.style.setProperty("--raven-composer-bottom-pad", keyboardOpen ? "0px" : "max(6px, env(safe-area-inset-bottom))");

        if (keyboardOpen && !keyboardWasOpenRef.current) {
          restoreBottomAfterKeyboardRef.current = nearBottom.current || document.activeElement === inputRef.current;
        }

        if (document.activeElement === inputRef.current && nearBottom.current) {
          scrollBottom();
        }

        if (!keyboardOpen && keyboardWasOpenRef.current && restoreBottomAfterKeyboardRef.current) {
          restoreBottomAfterKeyboardRef.current = false;
          requestAnimationFrame(() => {
            scrollBottom();
            window.setTimeout(scrollBottom, 90);
            window.setTimeout(scrollBottom, 240);
          });
        }

        keyboardWasOpenRef.current = keyboardOpen;
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
      document.documentElement.style.removeProperty("--raven-composer-bottom-pad");
    };
  }, []);

  useEffect(() => {
    const closeMenu = (event: PointerEvent) => {
      const target = event.target as Node;
      const element = event.target as Element | null;
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false);
      if (!element?.closest?.('[data-raven-message-menu]')) setActionMenuId(null);
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(target) && !element?.closest?.('[data-attachment-trigger]')) setAttachmentMenuOpen(false);
      if (pickerRef.current && !pickerRef.current.contains(target) && !element?.closest?.('[data-composer-picker-trigger]')) setPickerOpen(false);
      if (!element?.closest?.('[data-gif-picker]') && !element?.closest?.('[data-gif-trigger]')) setGifOpen(false);
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
    let disposed = false;
    const clearPresence = () => {
      void supabase.from("direct_raven_presence").delete().eq("conversation_id", conversationId).eq("user_id", userId);
    };
    const writePresence = async () => {
      if (disposed) return;
      if (document.visibilityState !== "visible") {
        clearPresence();
        return;
      }
      await supabase.from("direct_raven_presence").upsert({
        conversation_id: conversationId,
        user_id: userId,
        active_until: new Date(Date.now() + 20_000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "conversation_id,user_id" });
    };
    void writePresence();
    const timer = window.setInterval(() => void writePresence(), 8_000);
    const visibility = () => document.visibilityState === "visible" ? void writePresence() : clearPresence();
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", clearPresence);
    return () => {
      disposed = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", clearPresence);
      clearPresence();
    };
  }, [conversationId, supabase, userId]);

  useEffect(() => {
    if (openedReadDone.current || document.visibilityState !== "visible") return;
    const latest = loadedMessages.current.at(-1);
    if (!latest) return;
    openedReadDone.current = true;
    window.dispatchEvent(new CustomEvent("direct-raven-read", { detail: { conversationId, cleared: unreadCount } }));

    const markOpenedRead = async () => {
      const readAt = new Date().toISOString();
      const { error: readError } = await supabase.from("direct_raven_reads").upsert(
        { conversation_id: conversationId, user_id: userId, last_read_at: latest.created_at },
        { onConflict: "conversation_id,user_id" }
      );
      if (readError) return;

      await supabase
        .from("site_notifications")
        .update({ read_at: readAt })
        .eq("user_id", userId)
        .is("read_at", null)
        .contains("context", { conversationId });

      window.dispatchEvent(new CustomEvent("direct-raven-read", { detail: { conversationId } }));
      window.dispatchEvent(new CustomEvent("asofab:notifications-changed"));
    };

    void markOpenedRead();
  }, [conversationId, supabase, userId, unreadCount]);


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

    const markReadAt = async (at?: string, force = false) => {
      if (document.visibilityState !== "visible" || (!force && !nearBottom.current)) return;
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

    const markConversationOpened = async () => {
      if (document.visibilityState !== "visible") return;
      const latest = loadedMessages.current.at(-1);
      if (!latest) {
        await markNotificationRead();
        return;
      }
      const { error: readError } = await supabase.from("direct_raven_reads").upsert(
        { conversation_id: conversationId, user_id: userId, last_read_at: latest.created_at },
        { onConflict: "conversation_id,user_id" }
      );
      if (readError) return;
      await markNotificationRead();
      window.dispatchEvent(new CustomEvent("direct-raven-read", { detail: { conversationId } }));
    };

    const sync = async (includeMessages = true) => {
      if (document.visibilityState !== "visible") return;
      let query = supabase
        .from("direct_raven_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at");
      const oldest = loadedMessages.current[0];
      if (oldest) query = query.gte("created_at", oldest.created_at);
      const messagePromise = includeMessages
        ? query
        : Promise.resolve({ data: null as DirectRavenMessage[] | null, error: null });

      const readPromise = !isGuild && partner
        ? supabase.from("direct_raven_reads").select("last_read_at").eq("conversation_id", conversationId).eq("user_id", partner.id).maybeSingle()
        : Promise.resolve({ data: null, error: null });
      const guildReadPromise = isGuild
        ? supabase.from("direct_raven_reads").select("user_id,last_read_at").eq("conversation_id", conversationId)
        : Promise.resolve({ data: [], error: null });
      const blockPromise = !isGuild && partner
        ? supabase.from("direct_raven_blocks").select("blocker_id,blocked_id").or(`and(blocker_id.eq.${userId},blocked_id.eq.${partner.id}),and(blocker_id.eq.${partner.id},blocked_id.eq.${userId})`)
        : Promise.resolve({ data: [], error: null });
      const [{ data }, { data: reads }, { data: guildReadRows }, { data: blocks }] = await Promise.all([messagePromise, readPromise, guildReadPromise, blockPromise]);

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

    void markConversationOpened();
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
          if (document.visibilityState === "visible") void markReadAt(message.created_at, true);
          if (nearBottom.current) requestAnimationFrame(scrollBottom);
          else setNewMessages(true);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "direct_raven_messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const message = payload.new as DirectRavenMessage;
          setMessages((current) => current.map((entry) => entry.id === message.id ? message : entry));
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_raven_reads", filter: `conversation_id=eq.${conversationId}` },
        () => void sync(false)
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

    const timer = setInterval(() => void sync(), 30000);
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

  function openNativeFilePicker(input: HTMLInputElement | null) {
    // A synchronous click is the most reliable path on iOS Safari/PWA and
    // keeps the picker tied to the user's gesture.
    input?.click();
  }

  function cancelMessageHold() {
    if (messageHoldTimerRef.current !== null) window.clearTimeout(messageHoldTimerRef.current);
    messageHoldTimerRef.current = null;
    messageHoldStartRef.current = null;
  }

  function startSwipeReply(event: React.PointerEvent<HTMLDivElement>, message: DirectRavenMessage) {
    if (message.deleted_at) return;

    const interactive = (event.target as Element | null)?.closest?.("button,a,input,textarea,[role='button']");
    if (!interactive && (event.pointerType === "touch" || event.pointerType === "pen")) {
      cancelMessageHold();
      messageHoldStartRef.current = { id: message.id, x: event.clientX, y: event.clientY };
      messageHoldTimerRef.current = window.setTimeout(() => {
        messageHoldTimerRef.current = null;
        window.dispatchEvent(new CustomEvent("direct-raven-open-reactions", { detail: { messageId: message.id } }));
      }, 430);
    }

    if (event.pointerType !== "touch" || closed) return;
    swipeRef.current = { id: message.id, startX: event.clientX, startY: event.clientY, lastX: event.clientX, row: event.currentTarget, horizontal: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function moveSwipeReply(event: React.PointerEvent<HTMLDivElement>) {
    const held = messageHoldStartRef.current;
    if (held && (Math.abs(event.clientX - held.x) > 8 || Math.abs(event.clientY - held.y) > 8)) cancelMessageHold();

    const swipe = swipeRef.current;
    if (!swipe || swipe.id !== event.currentTarget.dataset.messageId) return;
    const dx = event.clientX - swipe.startX;
    const dy = event.clientY - swipe.startY;
    swipe.lastX = event.clientX;
    if (!swipe.horizontal && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.25) swipe.horizontal = true;
    if (!swipe.horizontal) return;
    cancelMessageHold();
    const offset = Math.max(0, Math.min(62, dx * .72));
    swipe.row.style.setProperty("--raven-swipe-x", `${offset}px`);
  }

  function focusComposerForReply() {
    const input = inputRef.current;
    if (!input) return;
    const mobile = window.matchMedia("(max-width: 760px)").matches;

    // On iOS the focus must remain inside the original user gesture. Delaying it
    // through rAF can leave the reply state active without opening the keyboard.
    if (mobile) input.focus();
    else input.focus({ preventScroll: true });

    restoreBottomAfterKeyboardRef.current = true;
    requestAnimationFrame(() => {
      input.scrollIntoView({ block: "nearest", inline: "nearest" });
      scrollBottom();
    });
    window.setTimeout(scrollBottom, 120);
  }

  function beginReply(message: DirectRavenMessage) {
    setReply(message);
    setEditing(null);
    focusComposerForReply();
  }

  function endSwipeReply(event: React.PointerEvent<HTMLDivElement>, message: DirectRavenMessage) {
    cancelMessageHold();
    const swipe = swipeRef.current;
    if (!swipe || swipe.id !== message.id) return;
    const dx = swipe.lastX - swipe.startX;
    swipe.row.style.setProperty("--raven-swipe-x", "0px");
    if (swipe.horizontal && dx > 52) {
      beginReply(message);
    }
    swipeRef.current = null;
    try { event.currentTarget.releasePointerCapture?.(event.pointerId); } catch {}
  }

  function chooseFile(next: File | undefined) {
    if (!next) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(next.type) || next.size > 8 * 1024 * 1024) {
      setError("Choose a JPEG, PNG, WebP or GIF up to 8 MB.");
      return;
    }
    setError("");
    setFile(next);
    setAttachmentMenuOpen(false);
  }

  function addPortrait(id: string) {
    const count = parseRavenBody(body, true).portraitIds.length;
    if (count >= MAX_PORTRAITS) {
      setError(`You can insert up to ${MAX_PORTRAITS} mini portraits to one raven.`);
      return;
    }
    setError("");
    const input = inputRef.current;
    const start = input?.selectionStart ?? body.length;
    const before = body.slice(0, start);
    const after = body.slice(input?.selectionEnd ?? start);
    const token = `[[portrait:${id}]]`;
    const prefix = before && !/\s$/.test(before) ? " " : "";
    const suffix = after && !/^\s/.test(after) ? " " : "";
    insertComposerText(`${prefix}${token}${suffix}`, false);
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
    const outgoingBody = body.trim();
    const outgoingFile = file;
    const outgoingGif = gif;
    const outgoingReply = reply;
    const outgoingEditing = editing;
    if ((!outgoingBody && !outgoingFile && !outgoingGif) || sendLock.current || closed) return;

    sendLock.current = true;
    if (!outgoingEditing) inputRef.current?.focus({ preventScroll: true });
    setSending(true);
    setError("");
    let path: string | null = null;

    // A sent raven should feel immediate: clear the submitted draft while keeping
    // the composer mounted and focused so the next message can be typed at once.
    if (!outgoingEditing) {
      setBody("");
      setGif(null);
      setGifOpen(false);
      setFile(null);
      setReply(null);
      resetDraftExtras();
      requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    }

    try {
      if (outgoingFile && !outgoingEditing) {
        const extension = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/gif": "gif",
        }[outgoingFile.type];
        path = `${conversationId}/${userId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("raven-media")
          .upload(path, outgoingFile, { contentType: outgoingFile.type });
        if (uploadError) throw Error("The image could not be uploaded. Please try again.");
      }

      const query = outgoingEditing
        ? supabase
            .from("direct_raven_messages")
            .update({ body: outgoingBody })
            .eq("id", outgoingEditing)
            .eq("sender_id", userId)
            .is("deleted_at", null)
        : supabase.from("direct_raven_messages").insert({
            conversation_id: conversationId,
            sender_id: userId,
            body: outgoingBody,
            ...(outgoingGif ? { gif: outgoingGif } : {}),
            ...(path ? { attachment_path: path } : {}),
            ...(outgoingReply ? { reply_to: outgoingReply.id } : {}),
          });

      const { data, error: sendError } = await query.select("*").single();
      if (sendError || !data) throw Error("The raven could not be sent. Your draft is still here.");
      nearBottom.current = true;
      setMessages((current) =>
        current.some((message) => message.id === data.id)
          ? current.map((message) => (message.id === data.id ? data : message))
          : [...current, data]
      );
      if (outgoingEditing) {
        setBody("");
        setEditing(null);
        resetDraftExtras();
      }
      window.dispatchEvent(new CustomEvent("direct-raven-read", { detail: { conversationId } }));
      if (!outgoingEditing) requestAnimationFrame(() => {
        void fetch("/api/notifications/direct-raven", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: data.id }),
        }).catch(() => {});
      });
    } catch (caught) {
      if (path) await supabase.storage.from("raven-media").remove([path]);
      if (!outgoingEditing) {
        setBody((current) => current.length ? current : body);
        if (outgoingGif) setGif((current) => current ?? outgoingGif);
        if (outgoingFile) setFile((current) => current ?? outgoingFile);
        if (outgoingReply) setReply((current) => current ?? outgoingReply);
      }
      setError(caught instanceof Error ? caught.message : "Could not send. Please try again.");
    } finally {
      sendLock.current = false;
      setSending(false);
      requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
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

  function scrollToMessageNode(messageId: string) {
    const target = document.getElementById(`raven-${messageId}`);
    if (!target) return false;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.remove(styles.messageJumpTarget);
    requestAnimationFrame(() => {
      target.classList.add(styles.messageJumpTarget);
      window.setTimeout(() => target.classList.remove(styles.messageJumpTarget), 1500);
    });
    return true;
  }

  async function jumpToMessage(messageId: string) {
    if (scrollToMessageNode(messageId)) return;

    const { data: targetMessage, error: targetError } = await supabase
      .from("direct_raven_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("id", messageId)
      .maybeSingle();

    if (targetError || !targetMessage) {
      setError("That earlier raven could not be found.");
      return;
    }

    const [beforeResult, afterResult] = await Promise.all([
      supabase.from("direct_raven_messages").select("*").eq("conversation_id", conversationId).lte("created_at", targetMessage.created_at).order("created_at", { ascending: false }).limit(40),
      supabase.from("direct_raven_messages").select("*").eq("conversation_id", conversationId).gt("created_at", targetMessage.created_at).order("created_at", { ascending: true }).limit(40),
    ]);

    const around = [
      ...((beforeResult.data ?? []) as DirectRavenMessage[]).reverse(),
      ...((afterResult.data ?? []) as DirectRavenMessage[]),
    ];

    setMessages((current) => {
      const map = new Map<string, DirectRavenMessage>();
      for (const message of [...around, ...current]) map.set(message.id, message);
      return [...map.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
    });
    nearBottom.current = false;
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToMessageNode(messageId)));
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
    if (message.sender_id !== userId) return [];
    if (!isGuild) {
      return partner && partnerRead >= message.created_at
        ? [{ user_id: partner.id, last_read_at: partnerRead }]
        : [];
    }
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
    isGuild
      ? memberships.filter((membership) => membership.user_id !== userId && membership.joined_at <= message.created_at).length
      : partner ? 1 : 0;


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
        onPointerDown={() => {
          if (document.activeElement === inputRef.current) {
            // Tapping the transcript is another keyboard-dismiss path on iOS.
            // Treat it exactly like pressing Done so the viewport settles back
            // onto the newest raven instead of leaving the thread suspended.
            restoreBottomAfterKeyboardRef.current = true;
            inputRef.current?.blur();
            requestAnimationFrame(scrollBottom);
            window.setTimeout(scrollBottom, 90);
            window.setTimeout(scrollBottom, 220);
            window.setTimeout(scrollBottom, 420);
          }
        }}
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
              {message.id === firstUnreadId && <div id="raven-unread-divider" className={styles.unreadDivider}><span>{unreadCount} unread {unreadCount === 1 ? "raven" : "ravens"}</span></div>}
              <div id={`raven-${message.id}`} data-message-id={message.id} className={`${styles.messageRow} ${mine ? styles.mine : styles.theirs} ${actionMenuId === message.id ? styles.messageRowMenuOpen : ""}`}
                onPointerDown={(event) => startSwipeReply(event, message)}
                onPointerMove={moveSwipeReply}
                onPointerUp={(event) => endSwipeReply(event, message)}
                onPointerCancel={(event) => endSwipeReply(event, message)}
              >
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
                    <button
                      type="button"
                      className={styles.replyQuote}
                      onClick={() => void jumpToMessage(message.reply_to!)}
                      aria-label="Go to quoted raven"
                    >
                      {parent
                        ? parent.deleted_at
                          ? <span className={styles.replyQuoteCopy}>Withdrawn raven</span>
                          : (() => {
                              const descriptor = quoteDescriptor(parent);
                              return <span className={styles.replyQuoteCopy}>{descriptor.kind && <span className={styles.replyQuoteIcon}><QuoteGlyph kind={descriptor.kind} /></span>}<span>{descriptor.label}</span></span>;
                            })()
                        : <span className={styles.replyQuoteCopy}>Reply to an earlier raven</span>}
                    </button>
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
                  {message.deleted_at ? <p>This raven was withdrawn.</p> : <RavenMessageContent body={message.body} returnTo={`/messages/${conversationId}?focus=${message.id}`} />}
                  <div className={styles.messageFooter}>
                    {!message.deleted_at && <div className={styles.messageActions}>
                      <MessageReactions messageId={message.id} userId={userId} />
                      {!closed && <button type="button" className={styles.inlineReplyButton} onClick={() => beginReply(message)}>Reply</button>}
                    </div>}
                    <span className={styles.messageMeta}>
                      {message.edited_at && !message.deleted_at && <small>edited</small>}
                      <time dateTime={message.created_at}>{time(message.created_at)}</time>
                      {mine && !message.deleted_at && (() => {
                        const seen = seenFor(message);
                        const eligible = eligibleCountFor(message);
                        const allSeen = eligible > 0 && seen.length === eligible;
                        const someSeen = seen.length > 0;
                        return (
                          <button
                            type="button"
                            className={`${styles.receiptButton} ${allSeen ? styles.receiptSeenAll : ""}`}
                            onClick={() => setSeenPanelId(message.id)}
                            aria-label={allSeen ? (isGuild ? "Seen by all. Show read receipts" : "Seen. Show read receipt") : someSeen ? `Seen by ${seen.length}. Show read receipts` : "Sent. Show read receipts"}
                            title={allSeen ? (isGuild ? "Seen by all" : "Seen") : someSeen ? `Seen by ${seen.length}` : "Sent"}
                          >
                            {someSeen ? (
                              <svg viewBox="0 0 22 14" aria-hidden="true"><path d="m1.5 7.3 3.1 3.2 6-7"/><path d="m8 8.7 2 1.8 7-8"/></svg>
                            ) : (
                              <svg viewBox="0 0 14 14" aria-hidden="true"><path d="m1.7 7.4 3.2 3.1 7-7.2"/></svg>
                            )}
                          </button>
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
                            {!closed && <button type="button" onClick={() => { setActionMenuId(null); beginReply(message); }}>Reply</button>}
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
              <div className={`${styles.draftContext} ${reply ? styles.replyDraftContext : ""}`}>
                <span className={styles.draftContextCopy}>
                  <small>{editing ? "Editing raven" : "Replying to"}</small>
                  <b>{editing ? "Your message" : (reply ? (() => { const descriptor = quoteDescriptor(reply); return <span className={styles.draftQuoteSummary}>{descriptor.kind && <span className={styles.replyQuoteIcon}><QuoteGlyph kind={descriptor.kind} /></span>}<span>{descriptor.label}</span></span>; })() : "Raven")}</b>
                </span>
                <button
                  type="button"
                  className={styles.draftContextClose}
                  aria-label={editing ? "Cancel edit" : "Cancel reply"}
                  disabled={sending}
                  onClick={() => {
                    setReply(null);
                    if (editing) setBody("");
                    setEditing(null);
                    resetDraftExtras();
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </button>
              </div>
            )}

            {gifOpen && <div className={styles.gifPopover} data-gif-picker><GiphyPicker onSelect={value=>{setGif(value);setGifOpen(false);}}/></div>}
            {gif && <div className={styles.mediaPreview}><img src={gif.url} alt={gif.title}/><button type="button" disabled={sending} onClick={()=>setGif(null)}>Remove GIF</button></div>}
            {preview && (
              <div className={styles.mediaPreview}>
                <img src={preview} alt="Attachment preview" />
                <button type="button" disabled={sending} onClick={() => setFile(null)}>Remove image</button>
              </div>
            )}

            {pickerOpen && (
              <div ref={pickerRef} className={`${styles.reactionPicker} ${pickerTab === "portraits" ? styles.portraitPopover : styles.emojiPopover}`} aria-label={pickerTab === "portraits" ? "Mini portraits" : "Emoji"}>
                {pickerTab === "emoji" ? (
                  <EmojiPicker onSelect={(emoji) => insertComposerText(emoji, false)} />
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
                          disabled={sending || parseRavenBody(body, true).portraitIds.length >= MAX_PORTRAITS}
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
              <textarea
                ref={inputRef}
                disabled={sending && !!editing}
                value={body}
                onChange={(event) => setBody(event.target.value)}
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
                onPointerDown={(event) => event.preventDefault()}
                disabled={sending || (!body.trim() && !file && !gif)}
              >
                <RavenIcon size={18} /> {sending ? "Sending…" : editing ? "Save" : "Send"}
              </button>
            </form>

            <div className={styles.composerTools}>
              <button type="button" data-gif-trigger disabled={sending||!!editing} onClick={()=>{setGifOpen(v=>!v);setPickerOpen(false);setAttachmentMenuOpen(false);inputRef.current?.blur();}} aria-expanded={gifOpen}>GIF</button>
              <div ref={attachmentMenuRef} className={styles.attachmentToolWrap}>
                <button type="button" data-attachment-trigger className={styles.fileButton} disabled={!!editing || sending} onClick={() => { setGifOpen(false); setPickerOpen(false); if (window.matchMedia("(max-width: 760px), (pointer: coarse)").matches) { setAttachmentMenuOpen(false); openNativeFilePicker(photoLibraryRef.current); } else { setAttachmentMenuOpen((value) => !value); } }} aria-expanded={attachmentMenuOpen}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" /></svg> Image / GIF
                </button>
                {attachmentMenuOpen && <div className={styles.attachmentSourceMenu} onPointerDown={(event) => event.stopPropagation()}>
                  <button type="button" onClick={() => { setAttachmentMenuOpen(false); openNativeFilePicker(photoLibraryRef.current); }}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m6.5 17 4.2-4 2.5 2.2 2.2-2 2.2 3.8"/></svg>
                    <span><b>Photo Library</b><small>Choose a photo or GIF</small></span>
                  </button>
                </div>}
                <input ref={photoLibraryRef} className={styles.hiddenFileInput} type="file" disabled={!!editing || sending} accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { chooseFile(event.target.files?.[0]); event.target.value = ""; }} />
              </div>
              <button type="button" data-composer-picker-trigger disabled={sending} onClick={() => openPicker("emoji")} aria-expanded={pickerOpen}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="M9 10h.01M15 10h.01M8.5 14c1 1.4 2.1 2 3.5 2s2.5-.6 3.5-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> Emoji
              </button>
              <button type="button" data-composer-picker-trigger disabled={sending} onClick={() => openPicker("portraits")} aria-expanded={pickerOpen}>
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
                <p className={styles.kicker}>{isGuild ? "Guild Parley" : "Direct Raven"}</p>
                <h3>{eligibleCountFor(seenPanelMessage) > 0 && seenPanelRows.length === eligibleCountFor(seenPanelMessage) ? (isGuild ? "Seen by all" : "Seen") : seenPanelRows.length ? `Seen by ${seenPanelRows.length}` : "Not seen yet"}</h3>
              </div>
              <button type="button" className={styles.seenPanelClose} aria-label="Close read receipts" onClick={() => setSeenPanelId(null)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round"/></svg></button>
            </div>
            <div className={styles.seenList}>
              {seenPanelRows.length === 0 && <p className={styles.seenEmpty}>No one else has seen this raven yet.</p>}
              {seenPanelRows.map((receipt) => {
                const member = isGuild ? memberMap.get(receipt.user_id) : (partner?.id === receipt.user_id ? partner : undefined);
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
