"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./direct-raven.module.css";

export default function GuildAvatar({ path, name, size = 44 }: { path: string | null; name: string; size?: number }) {
  const supabase = useMemo(() => createClient(), []);
  const [src, setSrc] = useState("");

  useEffect(() => {
    let active = true;
    if (!path) {
      setSrc("");
      return;
    }
    void supabase.storage.from("raven-media").createSignedUrl(path, 3600).then(({ data }) => {
      if (active) setSrc(data?.signedUrl ?? "");
    });
    return () => { active = false; };
  }, [path, supabase]);

  return (
    <span className={styles.guildAvatar} style={{ width: size, height: size }} aria-hidden="true">
      {src ? <img src={src} alt="" /> : <span>{name.slice(0, 2).toUpperCase()}</span>}
    </span>
  );
}
