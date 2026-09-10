"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/database.types";
import styles from "@/app/users/[username]/profile.module.css";
type Friendship = { id: string; requester_id: string; recipient_id: string; accepted_at: string | null };
export default function ProfileFriends({ profileId, viewerId }: { profileId: string; viewerId: string | null }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Friendship[]>([]), [people, setPeople] = useState<Profile[]>([]);
  const [revision, setRevision] = useState(0), [busy, setBusy] = useState(false), [ready, setReady] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    if (!viewerId) return;
    let active = true;
    const load = async () => {
      const { data, error } = await supabase.from("member_friendships").select("*").or(`requester_id.eq.${profileId},recipient_id.eq.${profileId}`);
      if (!active) return;
      if (error) { setError("Friends could not be loaded."); return; }
      const friends = data as Friendship[];
      const ids = [...new Set(friends.map(f => f.requester_id === profileId ? f.recipient_id : f.requester_id))];
      const { data: profiles } = ids.length ? await supabase.from("profiles").select("*").in("id", ids) : { data: [] };
      if (active) { setRows(friends); setPeople(profiles ?? []); setReady(true); }
    };
    void load(); return () => { active = false; };
  }, [profileId, viewerId, revision, supabase]);
  const own = profileId === viewerId;
  const connection = rows.find(r => r.requester_id === viewerId || r.recipient_id === viewerId);
  async function act(action: "request" | "accept" | "remove", id?: string) {
    if (!viewerId || busy) return;
    setBusy(true); setError("");
    try {
      const { error } = action === "request" ? await supabase.from("member_friendships").insert({ requester_id: viewerId, recipient_id: profileId }) : action === "accept" ? await supabase.from("member_friendships").update({ accepted_at: new Date().toISOString() }).eq("id", id!) : await supabase.from("member_friendships").delete().eq("id", id!);
      if (error) throw error;
      setRevision(v => v + 1);
    } catch { setError("Could not update friendship. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className={styles.friends}>
    <div className={styles.friendHeader}><h2>Friends {ready && <small>{rows.filter(r => r.accepted_at).length}</small>}</h2>
      {viewerId && !own && ready && <div className={styles.actions}>{!connection ? <button className={styles.actionButton} disabled={busy} onClick={() => void act("request")}>＋ Add friend</button> : <><button className={styles.actionButton} disabled={busy} onClick={() => void act("remove", connection.id)}>{connection.accepted_at ? "Remove friend" : connection.requester_id === viewerId ? "Cancel request" : "Decline"}</button>{!connection.accepted_at && connection.recipient_id === viewerId && <button className={styles.actionButton} disabled={busy} onClick={() => void act("accept", connection.id)}>Accept request</button>}</>}</div>}
    </div>
    {!viewerId && <p><Link href="/login">Sign in</Link> to see friends and send requests.</p>}
    {rows.filter(row => row.accepted_at || own).map(row => {
      const person = people.find(p => p.id === (row.requester_id === profileId ? row.recipient_id : row.requester_id));
      if (!person) return null;
      return <div className={styles.friendRow} key={row.id}><Link href={`/users/${person.username}`}><span className={styles.friendAvatar}>{person.avatar_url ? <img src={person.avatar_url} alt="" /> : person.display_name.slice(0, 2)}</span><span>{person.display_name}<small>@{person.username}{!row.accepted_at ? row.recipient_id === viewerId ? " · Incoming request" : " · Request sent" : ""}</small></span></Link>{own && <div className={styles.actions}>{!row.accepted_at && row.recipient_id === viewerId && <button className={styles.actionButton} disabled={busy} onClick={() => void act("accept", row.id)}>Accept</button>}<button className={styles.actionButton} disabled={busy} onClick={() => void act("remove", row.id)}>{row.accepted_at ? "Remove" : row.recipient_id === viewerId ? "Decline" : "Cancel"}</button></div>}</div>;
    })}
    {ready && !rows.some(row => row.accepted_at || own) && <p className={styles.empty}>No friends yet.</p>}{error && <p role="status">{error}</p>}
  </section>;
}
