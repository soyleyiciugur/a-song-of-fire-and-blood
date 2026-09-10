import community from "@/data/flea-bottom.json";
import updates from "@/data/community-updates.json";
import forum from '@/data/forum.json';
import chapters from '@/data/chapters.json';
import { publishCommunity } from "@/lib/communityPublication.mjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return Response.json(publishCommunity(community, updates, Date.now(), forum, chapters), {
    headers: { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" },
  });
}
