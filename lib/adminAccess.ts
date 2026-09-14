import { getCurrentProfile } from "@/lib/auth";

export async function isLuckAdmin() {
  const profile = await getCurrentProfile();
  return profile?.username.toLowerCase() === "luck";
}
