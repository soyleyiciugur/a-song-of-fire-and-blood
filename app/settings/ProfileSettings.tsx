"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/database.types";
import type { AffinityField } from "@/lib/profileAffinity";
import styles from "@/app/(auth)/auth.module.css";

const THEMES = [
  ["default","Default"],
  ["dragonfire","Dragonfire"],
  ["winterfell","Winterfell"],
  ["oldtown","Oldtown"],
  ["royal","Royal Gold"],
  ["night","The Night"],
] as const;

export default function ProfileSettings({ profile, affinityCatalog }: { profile: Profile; affinityCatalog: AffinityField[] }) {
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<File | null>(null), [preview, setPreview] = useState(profile.banner_url ?? "");
  const [removeBanner, setRemoveBanner] = useState(false);
  const [affinity,setAffinity] = useState<Record<string,string>>(profile.affinity ?? {});
  const [theme,setTheme] = useState(profile.profile_theme ?? "default");
  const router = useRouter();
  useEffect(() => {
    if (!banner) { setPreview(removeBanner ? "" : profile.banner_url ?? ""); return; }
    const url = URL.createObjectURL(banner); setPreview(url); return () => URL.revokeObjectURL(url);
  }, [banner, profile.banner_url, removeBanner]);
  async function save(form: FormData) {
    if (busy) return;
    setBusy(true); setMessage("");
    const supabase = createClient();
    const uploadedPaths: string[] = [];
    let saved = false;
    try {
      const display_name = String(form.get("displayName") ?? "").trim(), bio = String(form.get("bio") ?? "").trim() || null;
      if (!display_name) throw Error("Please enter a display name.");
      async function upload(file: File, kind: string) {
        if (file.size > 2097152 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw Error("Use JPEG, PNG or WebP images up to 2 MB each.");
        const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
        const path = `${profile.id}/${kind}-${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
        if (error) throw Error("Image upload failed. Please try again.");
        uploadedPaths.push(path);
        return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }
      const avatar = form.get("avatar");
      const avatar_url = avatar instanceof File && avatar.size ? await upload(avatar, "avatar") : profile.avatar_url;
      const banner_url = banner ? await upload(banner, "banner") : removeBanner ? null : profile.banner_url ?? null;
      const cleanedAffinity=Object.fromEntries(Object.entries(affinity).filter(([,value])=>value));
      const { error } = await supabase.from("profiles").update({ display_name, bio, avatar_url, banner_url, affinity:cleanedAffinity, profile_theme:theme }).eq("id", profile.id);
      if (error) throw Error(`Your profile could not be saved. ${error.message}`);
      saved = true; setMessage("Profile updated."); router.refresh();
      window.dispatchEvent(new Event("profile-updated"));
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not save profile."); }
    finally { if (!saved && uploadedPaths.length) await supabase.storage.from("avatars").remove(uploadedPaths); setBusy(false); }
  }
  return <main className={styles.page}><section className={styles.panel}><Link href={`/users/${profile.username}`}>← Your profile</Link><h1>Profile settings</h1><p>@{profile.username}</p>
    <form onSubmit={e => { e.preventDefault(); void save(new FormData(e.currentTarget)); }}><fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: "grid", gap: 16 }}>
      <label>Profile banner{preview && <img src={preview} alt="Banner preview" style={{ width: "100%", aspectRatio: "3 / 1", objectFit: "cover", borderRadius: 10 }} />}<input name="banner" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { setBanner(e.target.files?.[0] ?? null); setRemoveBanner(false); }} /><small>Landscape image, ideally 1500 × 500. Maximum 2 MB.</small></label>
      {(preview || profile.banner_url) && <button type="button" onClick={() => { setBanner(null); setRemoveBanner(true); }}>Remove banner</button>}
      <label>Display name<input name="displayName" required defaultValue={profile.display_name} maxLength={60} /></label>
      <label>Bio<textarea name="bio" defaultValue={profile.bio ?? ""} maxLength={500} /></label>
      <label>Avatar<input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" /><small>JPEG, PNG or WebP, up to 2 MB.</small></label>
      <div style={{borderTop:"1px solid #4b4137",paddingTop:16,display:"grid",gap:14}}><h2 style={{margin:0,font:"600 23px var(--font-hotd)",color:"#d7b66f"}}>Profile customization</h2>
        <label>Profile theme<select value={theme} onChange={e=>setTheme(e.target.value)}>{THEMES.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><small>Changes the accents and atmosphere of your public profile only.</small></label>
        {affinityCatalog.map(field=><label key={field.key}>{field.label}<select value={affinity[field.key]??""} onChange={e=>setAffinity(current=>({...current,[field.key]:e.target.value}))}><option value="">Not selected</option>{field.options.map(option=><option key={option.id} value={option.id}>{option.title}</option>)}</select></label>)}
      </div>
      <button>{busy ? "Saving…" : "Save profile"}</button>
    </fieldset>{message && <p role="status">{message}</p>}</form>
  </section></main>;
}
