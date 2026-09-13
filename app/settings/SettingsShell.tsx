"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/supabase/database.types";
import type { AffinityField } from "@/lib/profileAffinity";
import ProfileSettings from "./ProfileSettings";
import NotificationCustomizationSettings from "@/components/pwa/NotificationCustomizationSettings";
import PushNotificationSettings from "@/components/pwa/PushNotificationSettings";
import styles from "./settings.module.css";

type SettingsTab = "profile" | "notifications";

export default function SettingsShell({ profile, affinityCatalog }: { profile: Profile; affinityCatalog: AffinityField[] }) {
  const [tab, setTab] = useState<SettingsTab>("profile");

  useEffect(() => {
    const syncHash = () => setTab(window.location.hash === "#notifications" || window.location.hash === "#raven-notifications" ? "notifications" : "profile");
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  function choose(next: SettingsTab) {
    setTab(next);
    const hash = next === "notifications" ? "#notifications" : "#profile";
    window.history.replaceState(null, "", `${window.location.pathname}${hash}`);
  }

  return <main className={styles.page}>
    <section className={styles.panel}>
      <Link className={styles.back} href={`/users/${profile.username}`}>← Your profile</Link>
      <div className={styles.settingsHeader}>
        <div><h1 className={styles.title}>Settings</h1><p className={styles.handle}>@{profile.username}</p></div>
      </div>
      <nav className={styles.settingsTabs} aria-label="Settings sections">
        <button type="button" aria-selected={tab === "profile"} className={tab === "profile" ? styles.settingsTabActive : ""} onClick={() => choose("profile")}>Profile</button>
        <button type="button" aria-selected={tab === "notifications"} className={tab === "notifications" ? styles.settingsTabActive : ""} onClick={() => choose("notifications")}>Notifications</button>
      </nav>
      <div className={styles.settingsTabBody}>
        {tab === "profile" ? <ProfileSettings profile={profile} affinityCatalog={affinityCatalog} /> : <div className={styles.notificationsTab} id="raven-notifications"><NotificationCustomizationSettings /><PushNotificationSettings /></div>}
      </div>
    </section>
  </main>;
}
