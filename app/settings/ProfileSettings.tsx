"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/database.types";
import type { AffinityField, AffinityOption } from "@/lib/profileAffinity";
import { Select } from "@/app/_components/Select";
import styles from "./settings.module.css";

const THEMES = [
  ["default", "Default"], ["dragonfire", "Dragonfire"], ["winterfell", "Winterfell"],
  ["oldtown", "Oldtown"], ["royal", "Royal Gold"], ["night", "The Night"],
] as const;

function asOptions(options: AffinityOption[]) { return options.map((option) => ({ id: option.id, name: option.title })); }

function MediaPicker({ field, value, onChange }: { field: AffinityField; value: string; onChange: (value: string) => void }) {
  return <div className={styles.field}>
    <span>{field.label}</span>
    <div className={styles.mediaPicker} role="listbox" aria-label={field.label}>
      {field.options.map((option) => <button type="button" role="option" aria-selected={value === option.id} title={option.title} key={option.id} className={`${styles.mediaItem} ${value === option.id ? styles.mediaItemSelected : ""}`} onClick={() => onChange(option.id)}>
        {option.mediaType === "video" && option.mediaSrc ? <video src={option.mediaSrc} muted playsInline preload="metadata" /> : option.image ? <img src={option.image} alt="" /> : <span>{option.title}</span>}
      </button>)}
    </div>
    {value && <button className={styles.clearChoice} type="button" onClick={() => onChange("")}>Clear selection</button>}
  </div>;
}

export default function ProfileSettings({ profile, affinityCatalog }: { profile: Profile; affinityCatalog: AffinityField[] }) {
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<File | null>(null), [preview, setPreview] = useState(profile.banner_url ?? "");
  const [avatarName, setAvatarName] = useState("No file selected"), [bannerName, setBannerName] = useState("No file selected");
  const [removeBanner, setRemoveBanner] = useState(false);
  const [affinity, setAffinity] = useState<Record<string, string>>(profile.affinity ?? {});
  const [theme, setTheme] = useState(profile.profile_theme ?? "default");
  const [quoteSpeaker, setQuoteSpeaker] = useState("");
  const router = useRouter();

  const fields = useMemo(() => Object.fromEntries(affinityCatalog.map((field) => [field.key, field])) as Record<string, AffinityField>, [affinityCatalog]);
  const quoteSpeakers = useMemo(() => {
    const byId = new Map<string, string>();
    for (const option of fields.quote?.options ?? []) if (option.portrait) byId.set(option.portrait, option.title.split(" — ").at(-1) ?? option.portrait);
    return [...byId].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [fields.quote]);
  const quoteOptions = useMemo(() => quoteSpeaker ? (fields.quote?.options ?? []).filter((option) => option.portrait === quoteSpeaker) : [], [fields.quote, quoteSpeaker]);

  useEffect(() => {
    const selected = fields.quote?.options.find((option) => option.id === affinity.quote);
    if (selected?.portrait) setQuoteSpeaker(selected.portrait);
  }, [affinity.quote, fields.quote]);

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
      const cleanedAffinity = Object.fromEntries(Object.entries(affinity).filter(([, value]) => value));
      const { error } = await supabase.from("profiles").update({ display_name, bio, avatar_url, banner_url, affinity: cleanedAffinity, profile_theme: theme }).eq("id", profile.id);
      if (error) throw Error(`Your profile could not be saved. ${error.message}`);
      saved = true; setMessage("Profile updated."); router.refresh(); window.dispatchEvent(new Event("profile-updated"));
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not save profile."); }
    finally { if (!saved && uploadedPaths.length) await supabase.storage.from("avatars").remove(uploadedPaths); setBusy(false); }
  }

  const setChoice = (key: string, value: string) => setAffinity((current) => ({ ...current, [key]: value }));
  const normalFields = ["character", "house", "dragon", "chapter"].map((key) => fields[key]).filter(Boolean);

  return <main className={styles.page}><section className={styles.panel}>
    <Link className={styles.back} href={`/users/${profile.username}`}>← Your profile</Link>
    <h1 className={styles.title}>Profile settings</h1><p className={styles.handle}>@{profile.username}</p>
    <form className={styles.form} onSubmit={e => { e.preventDefault(); void save(new FormData(e.currentTarget)); }}>
      <fieldset disabled={busy} className={styles.fieldset}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile</h2>
          <label className={styles.field}>Display name<input className={styles.textInput} name="displayName" required defaultValue={profile.display_name} maxLength={60} /></label>
          <label className={styles.field}>Bio<textarea className={styles.textarea} name="bio" defaultValue={profile.bio ?? ""} maxLength={500} /></label>
          <div className={styles.field}><span>Avatar</span><div className={styles.fileRow}><label className={styles.fileButton}>Choose image<input className={styles.fileInput} name="avatar" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setAvatarName(e.target.files?.[0]?.name ?? "No file selected")} /></label><span className={styles.fileName}>{avatarName}</span></div><small className={styles.hint}>JPEG, PNG or WebP, up to 2 MB.</small></div>
          <div className={styles.field}><span>Profile banner</span>{preview && <img src={preview} alt="Banner preview" className={styles.bannerPreview} />}<div className={styles.fileRow}><label className={styles.fileButton}>Choose banner<input className={styles.fileInput} name="banner" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const next = e.target.files?.[0] ?? null; setBanner(next); setBannerName(next?.name ?? "No file selected"); setRemoveBanner(false); }} /></label><span className={styles.fileName}>{bannerName}</span></div><small className={styles.hint}>Landscape image, ideally 1500 × 500. Maximum 2 MB.</small></div>
          {(preview || profile.banner_url) && <button className={styles.secondaryButton} type="button" onClick={() => { setBanner(null); setBannerName("No file selected"); setRemoveBanner(true); }}>Remove banner</button>}
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile customization</h2>
          <p className={styles.sectionIntro}>Choose the pieces of the chronicle that define your profile.</p>
          <div className={styles.field}><span>Profile theme</span><div className={styles.selectWrap}><Select value={theme} options={THEMES.map(([id, name]) => ({ id, name }))} onChange={setTheme} /></div><small className={styles.hint}>Changes the accents and atmosphere of your public profile only.</small></div>
          {normalFields.map((field) => <div className={styles.field} key={field.key}><span>{field.label}</span><div className={styles.selectWrap}><Select searchable value={affinity[field.key] ?? ""} options={asOptions(field.options)} onChange={(value) => setChoice(field.key, value)} placeholder="Not selected" /></div>{affinity[field.key] && <button className={styles.clearChoice} type="button" onClick={() => setChoice(field.key, "")}>Clear selection</button>}</div>)}
          {fields.quote && <div className={styles.field}><span>Favorite Quote</span><div className={styles.quoteGrid}><div className={styles.selectWrap}><Select searchable value={quoteSpeaker} options={quoteSpeakers} onChange={(value) => { setQuoteSpeaker(value); setChoice("quote", ""); }} placeholder="Choose character" /></div><div className={styles.selectWrap}><Select searchable value={affinity.quote ?? ""} options={asOptions(quoteOptions)} onChange={(value) => setChoice("quote", value)} placeholder={quoteSpeaker ? "Choose quote" : "Choose a character first"} /></div></div>{affinity.quote && <button className={styles.clearChoice} type="button" onClick={() => setChoice("quote", "")}>Clear selection</button>}</div>}
          {fields.meme && <MediaPicker field={fields.meme} value={affinity.meme ?? ""} onChange={(value) => setChoice("meme", value)} />}
          {fields.image && <MediaPicker field={fields.image} value={affinity.image ?? ""} onChange={(value) => setChoice("image", value)} />}
        </div>
        <button className={styles.saveButton}>{busy ? "Saving…" : "Save profile"}</button>
      </fieldset>
      {message && <p className={styles.status} role="status">{message}</p>}
    </form>
  </section></main>;
}
