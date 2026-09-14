import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import AdminShell from "./AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/admin");
  if (profile.username.toLowerCase() !== "luck") notFound();
  return <AdminShell>{children}</AdminShell>;
}
