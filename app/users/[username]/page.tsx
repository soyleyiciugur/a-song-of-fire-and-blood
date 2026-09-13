import ProfileGuestbook from "@/components/community/ProfileGuestbook";
import ProfileAffinity from "@/components/community/ProfileAffinity";
import { affinityCatalog } from "@/lib/profileAffinity";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth";
import SendRavenButton from "@/components/direct-raven/SendRavenButton";
import ProfileActivity from "@/components/community/ProfileActivity";
import ProfileFriends from "@/components/community/ProfileFriends";
import styles from "./profile.module.css";

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase.from("profiles").select("*").eq("username", username.toLowerCase()).single();
  if (!p) notFound();

  const [{ count: threads }, { count: posts }, { count: raven }, viewer] = await Promise.all([
    supabase.from("forum_threads").select("*", { count: "exact", head: true }).eq("user_author_id", p.id).eq("is_visible", true),
    supabase.from("forum_posts").select("*", { count: "exact", head: true }).eq("user_author_id", p.id).eq("is_visible", true),
    supabase.from("raven_comments").select("*", { count: "exact", head: true }).eq("user_author_id", p.id).eq("is_visible", true),
    getCurrentUser(),
  ]);

  const viewerProfile=viewer?await getCurrentProfile():null;
  const rawHue=Number(p.affinity?.theme_hue??348),rawSat=Number(p.affinity?.theme_saturation??58),rawLight=Number(p.affinity?.theme_lightness??52);
  const customAccent=`hsl(${Math.min(360,Math.max(0,rawHue))} ${Math.min(100,Math.max(20,rawSat))}% ${Math.min(76,Math.max(28,rawLight))}%)`;
  return (
    <main className={styles.page} data-theme={p.profile_theme ?? "default"} style={p.profile_theme==="custom"?{"--profile-accent":customAccent,"--profile-glow":`hsl(${rawHue} ${rawSat}% ${rawLight}% / .22)`} as React.CSSProperties:undefined}>
      <div className={styles.banner}>{p.banner_url && <img src={p.banner_url} alt="" />}</div>
      <section className={styles.card}>
        <div className={styles.avatar}>{p.avatar_url ? <img src={p.avatar_url} alt="" /> : p.display_name.slice(0, 2).toUpperCase()}</div>
        <div>
          <p className={styles.handle}>@{p.username}</p>
          <h1>{p.display_name}</h1>
          {p.role !== "member" && <span className={styles.role}>{p.role}</span>}
          <p className={styles.joined}>Joined {new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(p.created_at))}</p>
          {p.bio && <p className={styles.bio}>{p.bio}</p>}
          <div className={styles.actions}>
            {viewer?.id === p.id ? <Link href="/settings">Edit profile</Link> : <SendRavenButton username={p.username} />}
          </div>
        </div>
      </section>
      <dl className={styles.stats}>
        <div><dt>Threads</dt><dd>{threads ?? 0}</dd></div>
        <div><dt>Replies</dt><dd>{posts ?? 0}</dd></div>
        <div><dt>Raven’s Eye comments</dt><dd>{raven ?? 0}</dd></div>
      </dl>
      <ProfileFriends key={p.id} profileId={p.id} viewerId={viewer?.id ?? null} />
      <ProfileAffinity key={p.id} profileId={p.id} values={p.affinity??{}} catalog={affinityCatalog().map(field=>({...field,options:field.options.filter(option=>option.id===p.affinity?.[field.key]).map(option=>({ ...option, href: option.href.startsWith("/ravens-eye") ? `${option.href}${option.href.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(`/users/${p.username}`)}` : option.href }))}))} editable={false} />
      <ProfileGuestbook key={p.id} profileId={p.id} viewerId={viewer?.id??null} canModerate={viewerProfile?.role==="admin"||viewerProfile?.role==="moderator"} />
      <ProfileActivity key={p.id} userId={p.id} />
    </main>
  );
}
