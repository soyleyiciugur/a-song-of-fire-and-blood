"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/database.types";
import styles from "./navbar.module.css";

type AccountState = { profile: Profile | null; signedIn: boolean; profileReady: boolean; loaded: boolean };
const initialState: AccountState = { profile: null, signedIn: false, profileReady: false, loaded: false };

export default function AccountControl() {
  const [state, setState] = useState(initialState);
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setState({ profile: null, signedIn: false, profileReady: false, loaded: true });
        return;
      }
      let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (!profile) profile = (await supabase.rpc("ensure_own_profile")).data;
      const metadata = user.user_metadata as { username?: string; display_name?: string };
      const username = metadata.username || user.email?.split("@")[0] || "member";
      const fallback: Profile = { id:user.id, username, display_name:metadata.display_name||username, avatar_url:null, role:"member", bio:null, created_at:user.created_at, updated_at:user.updated_at??user.created_at };
      if (active) setState({ profile:profile??fallback, signedIn:true, profileReady:!!profile, loaded:true });
    };
    void load();
    const update = () => { void load(); };
    window.addEventListener("profile-updated", update);
    const { data } = supabase.auth.onAuthStateChange(() => window.setTimeout(() => void load(), 0));
    return () => { active=false; data.subscription.unsubscribe(); window.removeEventListener("profile-updated", update); };
  }, [pathname]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) details.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && detailsRef.current?.open) {
        detailsRef.current.open = false;
        detailsRef.current.querySelector<HTMLElement>("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, []);


  if (!state.signedIn || !state.profile) return <details ref={detailsRef} className={`${styles.accountMenu} ${styles.anonymousAccount}`}><summary aria-label="Account menu" title="Account"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 20v-1a7 7 0 0 1 14 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></summary><div onClick={() => { if (detailsRef.current) detailsRef.current.open = false; }}><Link href="/login">Sign in</Link><Link href="/register">Join</Link></div></details>;
  const profile=state.profile;
  return <details ref={detailsRef} className={styles.accountMenu}><summary aria-label="Account menu"><span>{profile.avatar_url?<img src={profile.avatar_url} alt=""/>:profile.display_name.slice(0,2).toUpperCase()}</span><b>{profile.display_name}</b></summary><div onClick={(event) => { if ((event.target as HTMLElement).closest("a,button") && detailsRef.current) detailsRef.current.open = false; }}><p className={styles.accountIdentity}><strong>{profile.display_name}</strong><small>@{profile.username}</small></p>{state.profileReady?<><Link href={`/users/${profile.username}`}>Profile</Link><Link href="/settings">Settings</Link></>:<p className={styles.profileNotice}>Profile setup pending</p>}<form action={logout}><button>Sign out</button></form></div></details>;
}
