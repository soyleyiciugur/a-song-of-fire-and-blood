"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./direct-raven.module.css";

export default function SendRavenButton({ username, className = "" }: { username: string; className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/users/${username}`)}`);
      return;
    }
    const { data, error: rpcError } = await supabase.rpc("start_direct_raven", { target_username: username });
    if (rpcError || !data) {
      const msg = rpcError?.message ?? "The raven could not be sent.";
      setError(msg.includes("blocked") ? "This raven path is closed." : "The raven could not be prepared.");
      setBusy(false);
      return;
    }
    router.push(`/messages/${data}`);
  };

  return (
    <span className={`${styles.sendWrap} ${className}`.trim()}>
      <button type="button" className={styles.sendRavenButton} onClick={start} disabled={busy}>
        <span aria-hidden="true">✦</span> {busy ? "Calling raven…" : "Send a Raven"}
      </button>
      {error && <small className={styles.inlineError}>{error}</small>}
    </span>
  );
}
