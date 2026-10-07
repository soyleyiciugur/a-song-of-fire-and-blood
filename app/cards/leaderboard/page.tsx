import { redirect } from "next/navigation";

export default function LegacyLeaderboardRoute() {
  redirect("/cards/ranks");
}
