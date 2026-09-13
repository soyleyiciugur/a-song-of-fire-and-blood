"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { refreshCommunity } from "@/lib/communityStore";
import styles from "./composer.module.css";
type Props = { kind: "thread" | "post" | "raven"; threadId?: string; entryId?: string; parentId?: string };

export default function Composer({ kind, threadId, entryId, parentId }: Props) {
  const [open, setOpen] = useState(false), [pending, setPending] = useState(false), [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const revealComposer = useCallback((behavior: ScrollBehavior = "smooth") => {
    const form = formRef.current;
    const actions = actionsRef.current;
    if (!form) return;

    const viewport = window.visualViewport;
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
    const target = actions ?? form;
    target.scrollIntoView({ block: "nearest", inline: "nearest", behavior });
    const rect = target.getBoundingClientRect();
    const safeBottom = viewportBottom - 14;
    const safeTop = viewportTop + 12;

    if (rect.bottom > safeBottom) {
      window.scrollBy({ top: rect.bottom - safeBottom, behavior });
    } else if (form.getBoundingClientRect().top < safeTop) {
      window.scrollBy({ top: form.getBoundingClientRect().top - safeTop, behavior });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Focus inside the user gesture lifecycle without letting Safari perform
    // its own abrupt focus-scroll. visualViewport then keeps the action row
    // just above the keyboard while it animates in.
    const frame = requestAnimationFrame(() => {
      if (document.activeElement !== textarea) textarea.focus();
      revealComposer("smooth");
    });

    const viewport = window.visualViewport;
    let settleTimer = 0;
    const sync = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => revealComposer("smooth"), 24);
    };
    viewport?.addEventListener("resize", sync);
    viewport?.addEventListener("scroll", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, [open, revealComposer]);

  function openComposer() {
    // iOS only guarantees the software keyboard when focus happens inside the
    // original tap/click gesture. Flush the textarea into the DOM, then use a
    // plain synchronous focus (preventScroll can suppress the keyboard in some
    // standalone Safari/PWA builds). The viewport listener below takes over the
    // scrolling once the keyboard begins its animation.
    flushSync(() => setOpen(true));
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      try {
        const end = textarea.value.length;
        textarea.setSelectionRange(end, end);
      } catch {}
    }

    requestAnimationFrame(() => {
      revealComposer("smooth");
      requestAnimationFrame(() => revealComposer("smooth"));
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true); setMessage("");
    try {
      const payload = kind === "thread" ? { kind, title: form.get("title"), body: form.get("body"), category: "Community" } : kind === "post" ? { kind, threadId, parentId, body: form.get("body") } : { kind, entryId, parentId, body: form.get("body") };
      const response = await fetch("/api/community/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { error?: string };
      if (response.status === 401) { setMessage("signin"); return; }
      if (!response.ok) { setMessage(data.error ?? "Could not save."); return; }
      setOpen(false); await refreshCommunity();
    } catch { setMessage("Could not post. Your draft is still here; please try again."); }
    finally { setPending(false); }
  }

  return <div className={`${styles.wrap} ${parentId ? styles.replyComposer : ""}`}>
    {!open ? <button type="button" onClick={openComposer}>{parentId ? "Reply" : kind === "thread" ? "Start a discussion" : kind === "post" ? "Reply at this table" : "Write a comment"}</button> : <form ref={formRef} onSubmit={submit}>
      {kind === "thread" && <input name="title" aria-label="Discussion title" disabled={pending} required minLength={3} maxLength={140} placeholder="Discussion title" />}
      <textarea ref={textareaRef} name="body" aria-label={parentId ? "Write a reply" : "Write your contribution"} disabled={pending} required maxLength={kind === "raven" ? 4000 : 10000} placeholder={parentId ? "Write a reply…" : "Write your contribution…"} onFocus={() => requestAnimationFrame(() => revealComposer("smooth"))} />
      <div ref={actionsRef}><button disabled={pending}>{pending ? "Posting…" : "Post"}</button><button type="button" disabled={pending} onClick={() => setOpen(false)}>Cancel</button></div>
      {message === "signin" ? <p><Link href="/login">Sign in</Link> or <Link href="/register">join</Link> to post.</p> : message && <p role="alert">{message}</p>}
    </form>}
  </div>;
}
