import community from "@/data/flea-bottom.json";
import updates from "@/data/community-updates.json";
import { publishCommunity } from "@/lib/communityPublication.mjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return Response.json(publishCommunity(community, updates), {
    headers: { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" },
  });
}
