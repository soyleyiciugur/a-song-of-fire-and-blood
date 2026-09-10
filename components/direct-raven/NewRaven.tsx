"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/database.types";
import RavenIcon from "./RavenIcon";
import styles from "./direct-raven.module.css";
export default function NewRaven() {
  const [open, setOpen] = useState(false), [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const clean = query.replace(/^@/, "").replace(/[^a-zA-Z0-9_-]/g, "");
      if (clean.length < 2) { setResults([]); return; }
      const [{ data }, { data: { user } }] = await Promise.all([
        supabase.from("profiles").select("*").ilike("username", `${clean}%`).limit(8), supabase.auth.getUser(),
      ]);
      if (active) setResults((data ?? []).filter(p => p.id !== user?.id));
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query, supabase]);
  async function start(username: string) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const { data, error } = await supabase.rpc("start_direct_raven", { target_username: username.replace(/^@/, "").trim() });
      if (error || !data) throw Error(error?.message.includes("blocked") ? "This raven path is closed." : "Member not found or conversation unavailable.");
      setOpen(false); setQuery(""); router.push(`/messages/${data}`); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <div className={styles.newRaven}>
    <button className={styles.sendRavenButton} onClick={() => setOpen(!open)} aria-expanded={open}><RavenIcon size={18} /> New Raven</button>
    {open && <form className={styles.recipientForm} onSubmit={e => { e.preventDefault(); void start(query); }}>
      <label htmlFor="raven-recipient">To a member</label>
      <input id="raven-recipient" autoFocus autoComplete="off" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search @username" maxLength={40} />
      <div className={styles.recipientResults}>{results.map(p => <button type="button" key={p.id} disabled={busy} onClick={() => void start(p.username)}><b>{p.display_name}</b><small>@{p.username}</small></button>)}</div>
      <button className={styles.sendRavenButton} disabled={busy || !query.trim()}>{busy ? "Opening…" : "Start conversation"}</button>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </form>}
  </div>;
}
