"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { DirectRavenConversation, DirectRavenMember, Profile } from "@/lib/supabase/database.types";
import GuildAvatar from "./GuildAvatar";
import styles from "./direct-raven.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  conversation: DirectRavenConversation;
  members: Profile[];
  memberships: DirectRavenMember[];
  userId: string;
};

export default function GuildParleyInfo({ open, onClose, conversation, members, memberships, userId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(conversation.title ?? "Guild Parley");
  const [description, setDescription] = useState(conversation.description ?? "");
  const [avatarPath, setAvatarPath] = useState(conversation.avatar_path ?? "");
  const [invite, setInvite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const isGuildmaster = conversation.owner_id === userId;

  if (!open) return null;

  async function save() {
    setBusy(true); setError("");
    const { error: updateError } = await supabase.rpc("update_guild_parley", {
      conversation_uuid: conversation.id,
      guild_name: name.trim(),
      guild_description: description.trim(),
      guild_avatar_path: avatarPath,
    });
    setBusy(false);
    if (updateError) { setError("Could not update the Guild Parley."); return; }
    router.refresh();
  }

  async function uploadAvatar(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setError("Choose a JPEG, PNG or WebP up to 8 MB."); return;
    }
    setBusy(true); setError("");
    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const path = `${conversation.id}/${userId}/guild-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("raven-media").upload(path, file, { contentType: file.type });
    if (uploadError) { setBusy(false); setError("Could not upload the guild image."); return; }
    const { error: updateError } = await supabase.rpc("update_guild_parley", {
      conversation_uuid: conversation.id,
      guild_name: name.trim(),
      guild_description: description.trim(),
      guild_avatar_path: path,
    });
    setBusy(false);
    if (updateError) { setError("The image uploaded, but the Guild Parley could not be updated."); return; }
    setAvatarPath(path);
    router.refresh();
  }

  async function addMember() {
    if (!invite.trim()) return;
    setBusy(true); setError("");
    const { error: addError } = await supabase.rpc("add_guild_member", { conversation_uuid: conversation.id, target_username: invite.trim() });
    setBusy(false);
    if (addError) { setError("That member could not be invited."); return; }
    setInvite("");
    router.refresh();
  }

  async function removeMember(id: string) {
    setBusy(true); setError("");
    const { error: removeError } = await supabase.rpc("remove_guild_member", { conversation_uuid: conversation.id, target_user: id });
    setBusy(false);
    if (removeError) { setError("Could not remove that member."); return; }
    router.refresh();
  }

  async function leave() {
    setBusy(true); setError("");
    const { error: leaveError } = await supabase.rpc("leave_guild_parley", { conversation_uuid: conversation.id });
    setBusy(false);
    if (leaveError) { setError("Could not leave the Guild Parley."); return; }
    router.push("/messages");
    router.refresh();
  }

  return (
    <div className={styles.guildInfoBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className={styles.guildInfoPanel} role="dialog" aria-modal="true" aria-label="Guild Parley details">
        <div className={styles.guildInfoTopbar}>
          <button type="button" className={styles.backInfoButton} onClick={onClose}>←</button>
          <b>Guild Parley</b>
          <button type="button" className={styles.iconClose} onClick={onClose}>×</button>
        </div>

        <div className={styles.guildHero}>
          <button type="button" className={styles.guildPhotoButton} disabled={!isGuildmaster || busy} onClick={() => inputRef.current?.click()} aria-label={isGuildmaster ? "Change guild image" : "Guild image"}>
            <GuildAvatar path={avatarPath || null} name={name} size={104} />
            {isGuildmaster && <span>Change image</span>}
          </button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => { void uploadAvatar(event.target.files?.[0]); event.currentTarget.value=""; }} />
          {isGuildmaster ? (
            <>
              <input className={styles.guildTitleInput} value={name} maxLength={60} onChange={(event) => setName(event.target.value)} />
              <textarea className={styles.guildDescriptionInput} value={description} maxLength={500} rows={3} onChange={(event) => setDescription(event.target.value)} placeholder="Add a guild description…" />
              <button type="button" className={styles.guildPrimaryButton} disabled={busy || name.trim().length < 2} onClick={() => void save()}>Save details</button>
            </>
          ) : (
            <>
              <h2>{conversation.title}</h2>
              <p>{conversation.description || "No description has been written for this guild."}</p>
            </>
          )}
          <small>{members.length} members</small>
        </div>

        <div className={styles.guildInfoSection}>
          <div className={styles.guildSectionHeading}><span>Members</span><small>{members.length}</small></div>
          {isGuildmaster && (
            <div className={styles.guildInviteRow}>
              <input value={invite} onChange={(event) => setInvite(event.target.value)} placeholder="Invite @username" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void addMember(); } }} />
              <button type="button" disabled={busy || !invite.trim()} onClick={() => void addMember()}>Invite</button>
            </div>
          )}
          <div className={styles.guildRoster}>
            {members.map((member) => {
              const role = memberships.find((membership) => membership.user_id === member.id)?.role ?? "member";
              return (
                <div key={member.id} className={styles.guildRosterItem}>
                  <span className={styles.avatar}>{member.avatar_url ? <img src={member.avatar_url} alt="" /> : member.display_name.slice(0,2).toUpperCase()}</span>
                  <span><b>{member.display_name}</b><small>@{member.username}</small></span>
                  {role === "guildmaster" && <em>Guildmaster</em>}
                  {isGuildmaster && member.id !== userId && <button type="button" disabled={busy} onClick={() => void removeMember(member.id)}>Remove</button>}
                </div>
              );
            })}
          </div>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}
        {confirmLeave ? (
          <div className={styles.leaveConfirm}>
            <p>Leave this Guild Parley? {isGuildmaster ? "A new Guildmaster will be chosen automatically." : "You can only return if invited again."}</p>
            <div><button type="button" className={styles.ghostButton} disabled={busy} onClick={() => setConfirmLeave(false)}>Stay</button><button type="button" className={styles.leaveGuildButton} disabled={busy} onClick={() => void leave()}>{busy ? "Leaving…" : "Leave Parley"}</button></div>
          </div>
        ) : (
          <button type="button" className={styles.leaveGuildButton} disabled={busy} onClick={() => setConfirmLeave(true)}>Leave Guild Parley</button>
        )}
      </aside>
    </div>
  );
}
