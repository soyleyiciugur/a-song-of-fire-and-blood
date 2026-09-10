"use client";
import { useState } from "react";
import Link from "next/link";
import { refreshCommunity } from "@/lib/communityStore";
import styles from "./composer.module.css";
type Props = { kind: "thread" | "post" | "raven"; threadId?: string; entryId?: string; parentId?: string };
export default function Composer({ kind, threadId, entryId, parentId }: Props) {
  const [open, setOpen] = useState(false), [pending, setPending] = useState(false), [message, setMessage] = useState("");
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
    {!open ? <button onClick={() => setOpen(true)}>{parentId ? "Reply" : kind === "thread" ? "Start a discussion" : kind === "post" ? "Reply at this table" : "Join the discussion"}</button> : <form onSubmit={submit}>
      {kind === "thread" && <input name="title" aria-label="Discussion title" disabled={pending} required minLength={3} maxLength={140} placeholder="Discussion title" />}
      <textarea name="body" aria-label={parentId ? "Write a reply" : "Write your contribution"} disabled={pending} required maxLength={kind === "raven" ? 4000 : 10000} placeholder={parentId ? "Write a reply…" : "Write your contribution…"} />
      <div><button disabled={pending}>{pending ? "Posting…" : "Post"}</button><button type="button" disabled={pending} onClick={() => setOpen(false)}>Cancel</button></div>
      {message === "signin" ? <p><Link href="/login">Sign in</Link> or <Link href="/register">join</Link> to post.</p> : message && <p role="alert">{message}</p>}
    </form>}
  </div>;
}
