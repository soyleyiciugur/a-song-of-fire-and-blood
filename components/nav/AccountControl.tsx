"use client";

import { useEffect, useState } from "react";
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
    const { data } = supabase.auth.onAuthStateChange(() => window.setTimeout(() => void load(), 0));
    return () => { active=false; data.subscription.unsubscribe(); };
  }, [pathname]);

  if (!state.loaded) return null;
  if (!state.signedIn || !state.profile) return <span className={styles.authLinks}><Link href="/login">Sign in</Link><Link href="/register">Join</Link></span>;
  const profile=state.profile;
  return <details className={styles.accountMenu}><summary aria-label="Account menu"><span>{profile.avatar_url?<img src={profile.avatar_url} alt=""/>:profile.display_name.slice(0,2).toUpperCase()}</span><b>@{profile.username}</b></summary><div>{state.profileReady?<><Link href={`/users/${profile.username}`}>Profile</Link><Link href="/messages">Direct Raven</Link><Link href="/settings">Settings</Link></>:<p className={styles.profileNotice}>Profile setup pending</p>}<form action={logout}><button>Sign out</button></form></div></details>;
}
