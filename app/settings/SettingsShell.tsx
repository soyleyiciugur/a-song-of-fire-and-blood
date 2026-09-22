"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/supabase/database.types";
import type { AffinityField } from "@/lib/profileAffinity";
import ProfileSettings from "./ProfileSettings";
import AdminNotificationSettings from "./AdminNotificationSettings";
import NotificationCustomizationSettings from "@/components/pwa/NotificationCustomizationSettings";
import PushNotificationSettings from "@/components/pwa/PushNotificationSettings";
import styles from "./settings.module.css";
import ReadingBoundarySettings from "./ReadingBoundarySettings";

type SettingsTab = "profile" | "notifications" | "admin";

type Props = {
  profile: Profile;
  affinityCatalog: AffinityField[];
  isAdmin: boolean;
  latestChapter: { title: string; href: string };
};

export default function SettingsShell({ profile, affinityCatalog, isAdmin, latestChapter }: Props) {
  const [tab, setTab] = useState<SettingsTab>("profile");

  useEffect(() => {
    const syncHash = () => {
      if (window.location.hash === "#notifications" || window.location.hash === "#raven-notifications") {
        setTab("notifications");
        return;
      }
      if (window.location.hash === "#admin" && isAdmin) {
        setTab("admin");
        return;
      }
      setTab("profile");
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [isAdmin]);

  function choose(next: SettingsTab) {
    if (next === "admin" && !isAdmin) return;
    setTab(next);
    const hash = next === "notifications" ? "#notifications" : next === "admin" ? "#admin" : "#profile";
    window.history.replaceState(null, "", `${window.location.pathname}${hash}`);
  }

  return <main className={styles.page}>
    <section className={styles.panel}>
      <Link className={styles.back} href={`/users/${profile.username}`}>← Your profile</Link>
      <div className={styles.settingsHeader}>
        <div><h1 className={styles.title}>Settings</h1><p className={styles.handle}>@{profile.username}</p></div>
      </div>
      <nav className={`${styles.settingsTabs} ${isAdmin ? styles.settingsTabsAdmin : ""}`} aria-label="Settings sections" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "profile"} className={tab === "profile" ? styles.settingsTabActive : ""} onClick={() => choose("profile")}>Profile</button>
        <button type="button" role="tab" aria-selected={tab === "notifications"} className={tab === "notifications" ? styles.settingsTabActive : ""} onClick={() => choose("notifications")}>Notifications</button>
        {isAdmin ? <button type="button" role="tab" aria-selected={tab === "admin"} className={tab === "admin" ? styles.settingsTabActive : ""} onClick={() => choose("admin")}>Admin</button> : null}
      </nav>
      <div className={styles.settingsTabBody}>
        {tab === "profile" ? <><ReadingBoundarySettings /><ProfileSettings profile={profile} affinityCatalog={affinityCatalog} /></> : null}
        {tab === "notifications" ? <div className={styles.notificationsTab} id="raven-notifications"><NotificationCustomizationSettings /><PushNotificationSettings /></div> : null}
        {tab === "admin" && isAdmin ? <AdminNotificationSettings latestChapter={latestChapter} /> : null}
      </div>
    </section>
  </main>;
}
