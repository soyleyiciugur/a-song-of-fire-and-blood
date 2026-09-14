import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import LedgerClient from "./LedgerClient";

export default async function Page() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return <LedgerClient userId={profile.id} username={profile.username} />;
}
