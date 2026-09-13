"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NotificationSourceIcon from "@/components/notifications/NotificationSourceIcon";
import { DEFAULT_NOTIFICATION_FLAGS, MASCOT_META, type NotificationPreferenceFlags, type NotificationPreferenceKey, type NotificationSource } from "@/lib/notifications/types";
import styles from "@/app/settings/settings.module.css";

type PreferenceGroup = {
  source: NotificationSource;
  title: string;
  copy: string;
  options: Array<{ key: NotificationPreferenceKey; label: string; note: string }>;
};

const GROUPS: PreferenceGroup[] = [
  {
    source: "tavern",
    title: "Taverns",
    copy: "Words, answers, and Favor from tavern discussions.",
    options: [
      { key: "tavern_answers", label: "Answers to your words", note: "When someone answers you or continues a discussion you began." },
      { key: "tavern_favor", label: "Favor at the tavern", note: "When another patron grants Favor to your words." },
    ],
  },
  {
    source: "ravens-eye",
    title: "The Raven's Eye",
    copy: "Sightings, Gutter spectacle, and activity around your words.",
    options: [
      { key: "ravens_eye_answers", label: "Answers in the Eye", note: "When someone answers your words beneath a sighting." },
      { key: "ravens_eye_likes", label: "Approval in the Eye", note: "When someone shows approval for your words." },
      { key: "ravens_eye_images", label: "Fresh sightings", note: "New images brought before the Raven's Eye." },
      { key: "gutter_memes", label: "Gutter Memes", note: "Fresh mockery and mischief from Flea Bottom." },
      { key: "gutter_reels", label: "Gutter Reels", note: "New moving spectacle from the Gutter." },
    ],
  },
  {
    source: "direct-raven",
    title: "Ravens & Parleys",
    copy: "Private correspondence and gatherings that call for your attention.",
    options: [
      { key: "direct_ravens", label: "Direct Ravens", note: "When someone sends word directly to you." },
      { key: "guild_parley", label: "Guild Parley", note: "Fresh words in a Guild Parley you belong to." },
    ],
  },
  {
    source: "chronicle",
    title: "Chronicle & Realm",
    copy: "Larger happenings worthy of a place in the record.",
    options: [
      { key: "new_chapters", label: "New chapters", note: "When new pages are added to the Chronicle." },
      { key: "realm_notices", label: "Realm notices", note: "Important notices and noteworthy site-wide tidings." },
    ],
  },
];

function normalizeFlags(value: unknown): NotificationPreferenceFlags {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(DEFAULT_NOTIFICATION_FLAGS).map(([key, fallback]) => [key, typeof source[key] === "boolean" ? source[key] : fallback])) as NotificationPreferenceFlags;
}

export default function NotificationCustomizationSettings() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [flags, setFlags] = useState<NotificationPreferenceFlags>({ ...DEFAULT_NOTIFICATION_FLAGS });
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async (id: string | null) => {
    setUserId(id);
    setReady(false);
    setMessage("");
    if (!id) { setReady(true); return; }
    const { data, error } = await supabase.from("notification_preferences").select("preferences").eq("user_id", id).maybeSingle();
    if (error) {
      setMessage("Your raven preferences could not be read.");
      setReady(true);
      return;
    }
    if (data) {
      setFlags(normalizeFlags(data.preferences));
    } else {
      const defaults = { ...DEFAULT_NOTIFICATION_FLAGS };
      setFlags(defaults);
      await supabase.from("notification_preferences").upsert({ user_id: id, mascot_mode: "balanced", preferences: defaults, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    }
    setReady(true);
  }, [supabase]);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => load(user?.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => void load(session?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, [load, supabase]);

  async function persist(nextFlags: NotificationPreferenceFlags, token: string) {
    if (!userId) return false;
    setSaving(token);
    setMessage("");
    const { error } = await supabase.from("notification_preferences").upsert({
      user_id: userId,
      mascot_mode: "balanced",
      preferences: nextFlags,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    setSaving(null);
    if (error) {
      setMessage("That preference could not be saved. Please try again.");
      return false;
    }
    window.dispatchEvent(new CustomEvent("asofab:notification-preferences-changed"));
    return true;
  }

  async function toggle(key: NotificationPreferenceKey) {
    if (!userId) return;
    const previous = flags;
    const next = { ...flags, [key]: !flags[key] };
    setFlags(next);
    const saved = await persist(next, key);
    if (!saved) setFlags(previous);
  }

  return <section className={`${styles.section} ${styles.notificationCustomization}`}>
    <div className={styles.notificationSectionHead}>
      <div>
        <span className={styles.notificationEyebrow}>From the innkeepers</span>
        <h2 className={styles.sectionTitle}>Raven notifications</h2>
        <p className={styles.sectionIntro}>Choose which tidings may reach you. Mara and Aldren share delivery automatically, with the balance kept on your account.</p>
      </div>
    </div>

    {!ready && <p className={styles.status}>Reading your raven preferences…</p>}
    {ready && !userId && <p className={styles.notificationSignIn}>Sign in to keep notification choices, unread counts, and mascot history tied to your account across devices.</p>}

    {ready && userId && <>
      <div className={styles.notificationSubsection}>
        <div className={styles.notificationSubhead}><span>Messenger</span><small>Balanced by default</small></div>
        <div className={styles.mascotRotation} aria-label="Mara and Aldren share notification delivery">
          <span className={styles.mascotPairLarge} aria-hidden="true"><Image src={MASCOT_META.mara.portrait} alt="" width={39} height={39} /><Image src={MASCOT_META.aldren.portrait} alt="" width={39} height={39} /></span>
          <span className={styles.mascotRotationCopy}>
            <strong>Mara & Aldren share the rookery</strong>
            <small>Each raven chooses an innkeeper at random, with a catch-up bias toward whichever voice has appeared less often. The same messenger will never take a third raven in a row.</small>
          </span>
          <span className={styles.mascotRotationMark} aria-hidden="true">✦</span>
        </div>
      </div>

      <div className={styles.notificationSubsection}>
        <div className={styles.notificationSubhead}><span>What reaches you</span><small>Saved to your account</small></div>
        <div className={styles.notificationGroups}>
          {GROUPS.map((group) => <section className={styles.notificationGroup} key={group.title}>
            <header><span className={styles.notificationGroupIcon} aria-hidden="true"><NotificationSourceIcon source={group.source} size={18} /></span><span><strong>{group.title}</strong><small>{group.copy}</small></span></header>
            <div className={styles.notificationOptionList}>
              {group.options.map((option) => <button type="button" className={styles.notificationOption} key={option.key} role="switch" aria-checked={flags[option.key]} disabled={Boolean(saving)} onClick={() => void toggle(option.key)}>
                <span><strong>{option.label}</strong><small>{option.note}</small></span>
                <span className={`${styles.notificationSwitch} ${flags[option.key] ? styles.notificationSwitchOn : ""}`} aria-hidden="true"><i /></span>
              </button>)}
            </div>
          </section>)}
        </div>
      </div>
    </>}
    {message && <p className={styles.status} role="status">{message}</p>}
  </section>;
}
