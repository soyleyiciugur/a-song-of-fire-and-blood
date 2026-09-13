import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { affinityCatalog } from "@/lib/profileAffinity";
import SettingsShell from "./SettingsShell";

export default async function Page() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return <SettingsShell profile={profile} affinityCatalog={affinityCatalog()} />;
}
