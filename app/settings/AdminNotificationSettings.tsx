"use client";

import { useMemo, useState } from "react";

import { MANUAL_NOTIFICATION_TEMPLATES, type ManualNotificationTemplateId } from "@/lib/notifications/manual";
import styles from "./settings.module.css";

type Audience = "single" | "all";
type MascotChoice = "balanced" | "mara" | "aldren";
type TemplateChoice = ManualNotificationTemplateId | "custom";

type Props = {
  latestChapter: { title: string; href: string };
};

const CUSTOM_TEMPLATE = {
  id: "custom" as const,
  label: "Custom raven",
  note: "Write the notice yourself and choose where it should open.",
};

export default function AdminNotificationSettings({ latestChapter }: Props) {
  const [templateId, setTemplateId] = useState<TemplateChoice>("new_chapter");
  const [audience, setAudience] = useState<Audience>("single");
  const [username, setUsername] = useState("");
  const [mascot, setMascot] = useState<MascotChoice>("balanced");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [href, setHref] = useState("/");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const template = useMemo(
    () => MANUAL_NOTIFICATION_TEMPLATES.find((item) => item.id === templateId) ?? null,
    [templateId],
  );

  async function send() {
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          username,
          templateId,
          mascot,
          title,
          body,
          href,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "The raven could not be sent.");
      setStatus(`Delivered ${payload.delivered ?? 0} of ${payload.total ?? 0} personal ravens.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The raven could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.adminNotify} aria-labelledby="admin-ravens-title">
      <header className={styles.adminNotifyHeader}>
        <span className={styles.adminEyebrow}>Luck only</span>
        <h2 id="admin-ravens-title" className={styles.sectionTitle}>Manual ravens</h2>
        <p className={styles.sectionIntro}>
          Send one of the prepared notices in Mara or Aldren&apos;s voice, or write a custom raven.
        </p>
      </header>

      <div className={styles.adminTemplateGrid}>
        {[...MANUAL_NOTIFICATION_TEMPLATES, CUSTOM_TEMPLATE].map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.adminTemplate} ${templateId === item.id ? styles.adminTemplateActive : ""}`}
            aria-pressed={templateId === item.id}
            onClick={() => setTemplateId(item.id as TemplateChoice)}
          >
            <strong>{item.label}</strong>
            <span>{item.note}</span>
          </button>
        ))}
      </div>

      {templateId === "new_chapter" ? (
        <div className={styles.adminDestination}>
          <span>Latest Chronicle chapter</span>
          <strong>{latestChapter.title}</strong>
          <code>{latestChapter.href}</code>
        </div>
      ) : null}

      <div className={styles.adminControlGrid}>
        <fieldset className={styles.adminFieldset}>
          <legend>Audience</legend>
          <div className={styles.adminSegmented}>
            <button type="button" className={audience === "single" ? styles.adminSegmentActive : ""} onClick={() => setAudience("single")}>One member</button>
            <button type="button" className={audience === "all" ? styles.adminSegmentActive : ""} onClick={() => setAudience("all")}>All members</button>
          </div>
          {audience === "single" ? (
            <label className={styles.field}>
              Username
              <input className={styles.textInput} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="@username" autoComplete="off" />
            </label>
          ) : (
            <p className={styles.adminWarning}>This sends the notice to every member account whose preferences allow that kind of raven.</p>
          )}
        </fieldset>

        <fieldset className={styles.adminFieldset}>
          <legend>Voice</legend>
          <div className={styles.adminSegmented}>
            <button type="button" className={mascot === "balanced" ? styles.adminSegmentActive : ""} onClick={() => setMascot("balanced")}>Balanced</button>
            <button type="button" className={mascot === "mara" ? styles.adminSegmentActive : ""} onClick={() => setMascot("mara")}>Mara</button>
            <button type="button" className={mascot === "aldren" ? styles.adminSegmentActive : ""} onClick={() => setMascot("aldren")}>Aldren</button>
          </div>
        </fieldset>
      </div>

      {template ? (
        <div className={styles.adminPreviewGrid}>
          <article className={styles.adminPreview}>
            <span>Mara</span>
            <strong>{template.copy.mara.title}</strong>
            <p>{template.copy.mara.body}</p>
          </article>
          <article className={styles.adminPreview}>
            <span>Aldren</span>
            <strong>{template.copy.aldren.title}</strong>
            <p>{template.copy.aldren.body}</p>
          </article>
        </div>
      ) : (
        <div className={styles.adminCustomFields}>
          <label className={styles.field}>
            Title
            <input className={styles.textInput} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="A fresh raven has arrived." />
          </label>
          <label className={styles.field}>
            Message
            <textarea className={styles.textarea} maxLength={500} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write the notice exactly as it should appear." />
          </label>
          <label className={styles.field}>
            Opens
            <input className={styles.textInput} maxLength={1000} value={href} onChange={(event) => setHref(event.target.value)} placeholder="/chapters/..." />
            <span className={styles.hint}>Use an internal path beginning with /.</span>
          </label>
        </div>
      )}

      <div className={styles.adminSendRow}>
        <button type="button" className={styles.saveButton} disabled={busy} onClick={send}>
          {busy ? "Sending raven…" : audience === "all" ? "Send to all members" : "Send personal raven"}
        </button>
        {status ? <p className={styles.status} role="status">{status}</p> : null}
      </div>
    </section>
  );
}
