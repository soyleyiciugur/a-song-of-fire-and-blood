"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./direct-raven.module.css";
export default function RavenAttachment({ path, onLoad }: { path: string; onLoad?: () => void }) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  useEffect(() => {
    let active = true;
    const sign = async () => {
      const { data, error } = await supabase.storage.from("raven-media").createSignedUrl(path, 3600);
      if (active) { setUrl(data?.signedUrl ?? ""); setFailed(!!error); }
    };
    void sign(); const timer = setInterval(() => void sign(), 45 * 60 * 1000);
    return () => { active = false; clearInterval(timer); };
  }, [path, supabase]);
  if (!url) return <small>{failed ? "Image unavailable." : "Loading image…"}</small>;
  return <a href={url} target="_blank" rel="noopener noreferrer" className={styles.attachment}><img src={url} alt="Shared image" onLoad={onLoad} /></a>;
}
