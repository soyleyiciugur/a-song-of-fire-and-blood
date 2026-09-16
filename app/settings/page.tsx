import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { affinityCatalog } from "@/lib/profileAffinity";
import SettingsShell from "./SettingsShell";
import { getChapters } from "@/lib/chapters";

export default async function Page() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const isAdmin = profile.username.toLowerCase() === "luck";
  const latest = getChapters().at(-1);
  const latestChapter = latest
    ? { title: latest.title, href: `/chapters/${encodeURIComponent(latest.slug)}` }
    : { title: "The Chronicle", href: "/chapters" };
  return <SettingsShell profile={profile} affinityCatalog={affinityCatalog()} isAdmin={isAdmin} latestChapter={latestChapter} />;
}
