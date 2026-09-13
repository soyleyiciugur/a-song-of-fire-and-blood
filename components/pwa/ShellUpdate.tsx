"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { guideMascot, installation, iosDevice, restorePush, saveInstallation, standalone, syncInstallation } from "@/lib/pwa/client";
import { shellRelease, reinstallCopy } from "@/lib/pwa/release";
import { MASCOT_META, type NotificationMascot } from "@/lib/notifications/types";
import styles from "./shellUpdate.module.css";

export default function ShellUpdate({ guide = false }: { guide?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const dismissedVersion = useRef<number | null>(null);
  const [open, setOpen] = useState(guide);
  const [prepared, setPrepared] = useState(guide);
  const [release, setRelease] = useState(shellRelease);
  const [mascot, setMascot] = useState<NotificationMascot>("mara");
  const [signedIn, setSignedIn] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [shortcut, setShortcut] = useState(false);
  const [unknown, setUnknown] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const check = async () => {
      const isInstalled = standalone();
      setInstalled(isInstalled);
      if (!guide && (!isInstalled || !iosDevice() || location.pathname === "/app-update")) return;
      const response = await fetch("/api/app-shell", { cache: "no-store" });
      if (!response.ok) return;
      const current = await response.json() as typeof shellRelease;
      if (!active) return;
      setRelease(current);
      const { data: { user } } = await supabase.auth.getUser();
      setSignedIn(Boolean(user));
      if (!isInstalled) { setMascot(await guideMascot(current.version)); return; }
      const local = installation(current.reinstallRequired ? 0 : current.version);
      const account = await syncInstallation(local, "check").catch(() => ({ version: local.version, mascot: null }));
      if (!active) return;
      const version = Math.max(local.version, account.version);
      setUnknown(version === 0);
      saveInstallation({ ...local, version });
      setMascot(account.mascot ?? await guideMascot(current.version));
      if (current.reinstallRequired && version < current.version) {
        let dismissed = dismissedVersion.current === current.version;
        try { dismissed ||= sessionStorage.getItem(`asofab:shell-later:${current.version}`) === "true"; } catch {}
        if (!dismissed || guide) setOpen(true);
      }
      if (local.pending && guide) { setPrepared(true); setOpen(true); }
      void restorePush().catch(() => { /* Explicit recovery remains available in Raven Settings. */ });
    };
    const run = () => { void check().catch(() => { if (active && guide) setMessage("The rookery could not be reached. Your guide remains here; try again when your connection returns."); }); };
    run();
    const { data } = supabase.auth.onAuthStateChange(() => { setTimeout(run, 0); });
    const visible = () => { if (document.visibilityState === "visible") run(); };
    document.addEventListener("visibilitychange", visible);
    return () => { active = false; data.subscription.unsubscribe(); document.removeEventListener("visibilitychange", visible); };
  }, [guide]);

  useEffect(() => {
    if (guide) return;
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open) dialog.current?.close();
  }, [open, guide]);

  function later() {
    dismissedVersion.current = release.version;
    try { sessionStorage.setItem(`asofab:shell-later:${release.version}`, "true"); } catch {}
    setOpen(false);
  }
  function prepare() {
    const local = installation(release.reinstallRequired ? 0 : release.version);
    saveInstallation({ ...local, pending: true });
    setPrepared(true);
  }
  async function acknowledge() {
    if (!standalone()) return;
    setBusy(true);
    setMessage("");
    try {
      const local = installation(0);
      await syncInstallation(local, "acknowledge");
      saveInstallation({ ...local, version: release.version, pending: false });
      setDone(true);
      const push = await restorePush().catch(() => "permission");
      setMessage(push === "restored" ? "Your new seal is recorded, and your ravens are ready." : "Your new seal is recorded. Visit Raven Settings to check delivery on this device.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  const meta = MASCOT_META[mascot];
  const content = <>
    <div className={styles.messenger}><Image src={meta.portrait} alt={meta.name} width={64} height={64} /><span>{meta.name}<small>A message from the rookery</small></span></div>
    <h2 id={guide ? "update-guide-title" : "shell-update-title"}>{done ? "The fresh seal is yours." : unknown && release.reinstallRequired ? "Check your Home Screen seal." : release.reinstallRequired ? reinstallCopy[mascot].title : "Your Home Screen seal."}</h2>
    {!done && <p>{unknown && release.reinstallRequired ? "A fresh seal has been issued, but this installation’s seal is not recorded. If you have already added the new icon, confirm it below. Otherwise, follow the guide." : release.reinstallRequired ? reinstallCopy[mascot].body : "No new seal is required at present. These instructions are here should you need to add ASOFAB again."} — {meta.name}</p>}
    {!done && release.reason && <p className={styles.reason}>{release.reason}</p>}
    {prepared && !done && <>
      <p>Your account keeps your profile, preferences, unread ravens, and messenger history. Unsynced changes on this device may be lost.</p>
      {!signedIn && <p><Link href="/login">Sign in to recover your account</Link>. If your session survives, the rookery welcomes you back without another sign-in.</p>}
      <ol><li>Remove the old ASOFAB icon from your Home Screen.</li><li>Return to ASOFAB in Safari.</li><li>Tap Share.</li><li>Choose Add to Home Screen, then open the new icon.</li></ol>
      <p>Keep this address in Safari before removing the icon:</p>
      <a className={styles.address} href="https://a-song-of-fire-and-blood.vercel.app/app-update" target="_blank" rel="noreferrer">a-song-of-fire-and-blood.vercel.app/app-update</a>
      <p>Opening this link may stay inside the app. If it does, copy the address into Safari.</p>
      <label className={styles.option}><input type="checkbox" checked={shortcut} onChange={e => setShortcut(e.target.checked)} /> I have the ASOFAB Updater Shortcut</label>
      {shortcut && <a className={styles.button} href="shortcuts://run-shortcut?name=ASOFAB%20Updater">Run ASOFAB Updater</a>}
      <p>The Shortcut can guide you and open the address. Removing and adding the icon remain yours to do. If the Shortcut is missing, follow the steps above.</p>
      {installed ? <button disabled={busy} onClick={acknowledge}>{busy ? "Recording your seal…" : "I’ve added it again"}</button> : <p>Open the new Home Screen icon to confirm your fresh seal.</p>}
    </>}
    {message && <p role="status">{message}</p>}
    {done && <p>{!signedIn && <><Link href="/login">Sign in to restore your account</Link> · </>}<Link href="/settings">Raven Settings</Link></p>}
    <div className={styles.actions}>{!prepared && !done && <button onClick={prepare}>Prepare Update</button>}{!guide && <button onClick={later}>{done ? "Return to the realm" : "Later"}</button>}{guide && <Link href="/">Return to the realm</Link>}</div>
  </>;
  if (guide) return <section className={styles.guide} aria-labelledby="update-guide-title">{content}</section>;
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="shell-update-title" onCancel={later} onClick={e => { if (e.target === e.currentTarget) later(); }}><div>{content}</div></dialog>;
}
