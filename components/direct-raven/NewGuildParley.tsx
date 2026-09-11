"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/database.types";
import styles from "./direct-raven.module.css";

export default function NewGuildParley() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    void Promise.all([
      supabase.from("profiles").select("*").order("display_name").limit(100),
      supabase.auth.getUser(),
    ]).then(([{ data }, { data: auth }]) => {
      if (active) setProfiles((data ?? []).filter((profile) => profile.id !== auth.user?.id));
    });
    return () => { active = false; };
  }, [open, supabase]);

  const visible = profiles.filter((profile) => {
    const needle = query.trim().toLowerCase();
    return !needle || `${profile.display_name} ${profile.username}`.toLowerCase().includes(needle);
  });

  async function create() {
    if (busy || name.trim().length < 2 || selected.length < 1) return;
    setBusy(true);
    setError("");
    const { data, error: createError } = await supabase.rpc("create_guild_parley", {
      guild_name: name.trim(),
      guild_description: description.trim(),
      member_ids: selected,
    });
    setBusy(false);
    if (createError || !data) {
      setError("The Guild Parley could not be formed. Please try again.");
      return;
    }
    setOpen(false);
    router.push(`/messages/${data}`);
    router.refresh();
  }

  return (
    <>
      <button type="button" className={styles.guildCreateButton} onClick={() => setOpen(true)}>✦ New Guild</button>
      {open && (
        <div className={styles.guildModalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section className={styles.guildModal} role="dialog" aria-modal="true" aria-labelledby="new-guild-title">
            <div className={styles.guildModalHeader}>
              <div>
                <p className={styles.kicker}>Gather the realm</p>
                <h2 id="new-guild-title">Create Guild Parley</h2>
              </div>
              <button type="button" className={styles.iconClose} onClick={() => setOpen(false)} aria-label="Close">×</button>
            </div>

            <label className={styles.guildField}>
              <span>Guild name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="The Small Council" />
            </label>
            <label className={styles.guildField}>
              <span>Description <small>optional</small></span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={3} placeholder="What is this parley for?" />
            </label>

            <div className={styles.guildMemberPicker}>
              <div className={styles.guildPickerTop}>
                <span>Invite members</span>
                <small>{selected.length} chosen</small>
              </div>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a member…" />
              <div className={styles.guildMemberList}>
                {visible.map((profile) => {
                  const active = selected.includes(profile.id);
                  return (
                    <button key={profile.id} type="button" className={active ? styles.guildMemberSelected : ""} onClick={() => setSelected((current) => active ? current.filter((id) => id !== profile.id) : [...current, profile.id])}>
                      <span className={styles.avatar}>{profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : profile.display_name.slice(0, 2).toUpperCase()}</span>
                      <span><b>{profile.display_name}</b><small>@{profile.username}</small></span>
                      <i aria-hidden="true">{active ? "✓" : "+"}</i>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className={styles.error} role="alert">{error}</p>}
            <div className={styles.guildModalActions}>
              <button type="button" className={styles.ghostButton} onClick={() => setOpen(false)}>Cancel</button>
              <button type="button" className={styles.guildPrimaryButton} disabled={busy || name.trim().length < 2 || selected.length < 1} onClick={() => void create()}>{busy ? "Gathering…" : "Create Guild"}</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
