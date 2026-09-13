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
  ["default", "Default"], ["targaryen", "House Targaryen"], ["stark", "House Stark"],
  ["arryn", "House Arryn"], ["tully", "House Tully"], ["greyjoy", "House Greyjoy"],
  ["lannister", "House Lannister"], ["baratheon", "House Baratheon"], ["tyrell", "House Tyrell"],
  ["martell", "House Martell"], ["dragonfire", "Dragonfire"], ["winterfell", "Winterfell"],
  ["oldtown", "Oldtown"], ["royal", "Royal Gold"], ["night", "The Night"], ["custom", "Custom colors"],
] as const;

function asOptions(options: AffinityOption[]) { return options.map((option) => ({ id: option.id, name: option.title })); }

function MediaPicker({ field, value, onChange }: { field: AffinityField; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false), [query, setQuery] = useState(""), [visible, setVisible] = useState(36);
  const selected = field.options.find((option) => option.id === value);
  const matches = useMemo(() => field.options.filter((option) => option.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [field.options, query]);
  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = before; window.removeEventListener("keydown", close); };
  }, [open]);
  return <div className={styles.field}>
    <span>{field.label}</span>
    <button className={styles.mediaChoice} type="button" onClick={() => { setQuery(""); setVisible(36); setOpen(true); }}>
      {selected ? <><span className={styles.mediaThumb}>{selected.mediaType === "video" ? <video src={selected.mediaSrc} muted playsInline preload="metadata" /> : <img src={selected.image} alt="" />}</span><span><strong>{selected.title}</strong><small>Change selection</small></span></> : <><span className={styles.emptyThumb}>+</span><span><strong>Choose from gallery</strong><small>Search and preview the archive.</small></span></>}
    </button>
    {value && <button className={styles.clearChoice} type="button" onClick={() => onChange("")}>Clear selection</button>}
    {open && <div className={styles.pickerBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section className={styles.pickerDialog} role="dialog" aria-modal="true" aria-label={`Choose ${field.label}`}><header><div><span>Gallery selection</span><h3>{field.label}</h3></div><button type="button" className={styles.iconButton} onClick={() => setOpen(false)} aria-label="Close gallery">×</button></header><label className={styles.searchBox}><span aria-hidden="true">⌕</span><input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setVisible(36); }} placeholder={`Filter ${field.label.toLowerCase()}s by caption…`} /></label><div className={styles.resultCount}>{matches.length} items</div><div className={styles.mediaPicker} role="listbox" aria-label={field.label}>{matches.slice(0, visible).map((option) => <button type="button" role="option" aria-selected={value === option.id} key={option.id} className={`${styles.mediaItem} ${value === option.id ? styles.mediaItemSelected : ""}`} onClick={() => { onChange(option.id); setOpen(false); }}>{option.mediaType === "video" && option.mediaSrc ? <video src={option.mediaSrc} muted playsInline preload="metadata" /> : option.image ? <img src={option.image} loading="lazy" alt="" /> : null}<span>{option.title}</span></button>)}</div>{!matches.length && <p className={styles.noResults}>No gallery items match that caption.</p>}{visible < matches.length && <button className={styles.loadMore} type="button" onClick={() => setVisible((count) => count + 36)}>Show more</button>}</section></div>}
  </div>;
}

function ColorMap({ affinity, onChange }: { affinity: Record<string, string>; onChange: (key: string, value: string) => void }) {
  const hue = Number(affinity.theme_hue ?? 348), saturation = Number(affinity.theme_saturation ?? 58), lightness = Number(affinity.theme_lightness ?? 52);
  const accent = `hsl(${hue} ${saturation}% ${lightness}%)`;
  return <div className={styles.colorStudio}><div className={styles.colorPreview} style={{ "--chosen-color": accent } as React.CSSProperties}><span>Live accent</span><strong>{accent}</strong></div><label>Hue map<input className={styles.hueRange} type="range" min="0" max="360" value={hue} onChange={(e) => onChange("theme_hue", e.target.value)} /></label><div className={styles.colorSplit}><label>Saturation<input type="range" min="20" max="100" value={saturation} onChange={(e) => onChange("theme_saturation", e.target.value)} /><output>{saturation}%</output></label><label>Brightness<input type="range" min="28" max="76" value={lightness} onChange={(e) => onChange("theme_lightness", e.target.value)} /><output>{lightness}%</output></label></div></div>;
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
          {theme === "custom" && <ColorMap affinity={affinity} onChange={setChoice} />}
          {normalFields.map((field) => <div className={styles.field} key={field.key}><span>{field.label}</span><div className={styles.selectWrap}><Select searchable value={affinity[field.key] ?? ""} options={asOptions(field.options)} onChange={(value) => setChoice(field.key, value)} placeholder="Not selected" /></div>{affinity[field.key] && <button className={styles.clearChoice} type="button" onClick={() => setChoice(field.key, "")}>Clear selection</button>}</div>)}
          {fields.quote && <div className={styles.field}><span>Favorite Quote</span><div className={styles.quoteGrid}><div className={styles.selectWrap}><Select searchable value={quoteSpeaker} options={quoteSpeakers} onChange={(value) => { setQuoteSpeaker(value); setChoice("quote", ""); }} placeholder="Choose character" /></div><div className={styles.selectWrap}><Select searchable value={affinity.quote ?? ""} options={asOptions(quoteOptions)} onChange={(value) => setChoice("quote", value)} placeholder={quoteSpeaker ? "Choose quote" : "Choose a character first"} /></div></div>{affinity.quote && <button className={styles.clearChoice} type="button" onClick={() => setChoice("quote", "")}>Clear selection</button>}</div>}
          {fields.meme && <MediaPicker field={fields.meme} value={affinity.meme ?? ""} onChange={(value) => setChoice("meme", value)} />}
          {fields.reel && <MediaPicker field={fields.reel} value={affinity.reel ?? ""} onChange={(value) => setChoice("reel", value)} />}
          {fields.image && <MediaPicker field={fields.image} value={affinity.image ?? ""} onChange={(value) => setChoice("image", value)} />}
        </div>
        <button className={styles.saveButton}>{busy ? "Saving…" : "Save profile"}</button>
      </fieldset>
      {message && <p className={styles.status} role="status">{message}</p>}
    </form>
  </section></main>;
}
