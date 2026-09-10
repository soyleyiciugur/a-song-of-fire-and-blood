import community from "@/data/flea-bottom.json";
import updates from "@/data/update-notes.json";
import forum from '@/data/forum.json';
import chapters from '@/data/chapters.json';
import { publishCommunity } from "@/lib/communityPublication.mjs";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const snapshot = publishCommunity(community, updates, Date.now(), forum, chapters);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
    const [{data:profiles},{data:threads},{data:posts},{data:raven}]=await Promise.all([
      supabase.from("profiles").select("*"),supabase.from("forum_threads").select("*").order("created_at"),supabase.from("forum_posts").select("*").order("created_at"),supabase.from("raven_comments").select("*").order("created_at")
    ]);
    const liveUsers=(profiles??[]).map(p=>({id:p.id,username:p.username,displayName:p.display_name,kind:"member" as const,bio:p.bio??"",avatar:p.display_name.slice(0,2).toUpperCase(),avatarUrl:p.avatar_url,color:"#65353d",profileHref:`/users/${p.username}`,role:p.role}));
    const viewerRole=liveUsers.find(p=>p.id===user?.id)?.role,mayModerate=viewerRole==="moderator"||viewerRole==="admin";
    snapshot.users.push(...liveUsers);
    snapshot.forumThreads.push(...(threads??[]).map(t=>({id:t.id,title:t.title,body:t.body,category:t.category,chapterSlug:t.chapter_slug,chapterTitle:null,spoilerThrough:t.spoiler_through??"current discussion",authorId:t.user_author_id??t.legacy_author_id??t.character_id??"",publishedAt:t.created_at,authorType:t.author_type,canEdit:!!user&&(t.user_author_id===user.id||mayModerate)})));
    const liveForumComments=(posts??[]).map(p=>({id:p.id,entryId:p.thread_id,parentId:p.parent_id,body:p.body,authorId:p.user_author_id??p.legacy_author_id??p.character_id??"",publishedAt:p.created_at,surface:"forum" as const,authorType:p.author_type,canEdit:!!user&&(p.user_author_id===user.id||mayModerate)}));
    const liveRavenComments=(raven??[]).map(c=>({id:c.id,entryId:c.entry_id,parentId:c.parent_id,body:c.body,authorId:c.user_author_id??c.legacy_author_id??c.character_id??"",publishedAt:c.created_at,authorType:c.author_type,canEdit:!!user&&(c.user_author_id===user.id||mayModerate)}));
    const liveParentKeys=new Set([...liveForumComments,...liveRavenComments].map(c=>`${c.entryId}:${c.id}`));
    const liveThreadIds=new Set((threads??[]).map(t=>t.id));
    snapshot.comments=snapshot.comments.filter(c=>(!c.liveThreadId||liveThreadIds.has(c.liveThreadId))&&(c.parentSource!=="supabase"||!!c.parentId&&liveParentKeys.has(`${c.entryId}:${c.parentId}`)));
    snapshot.comments.push(...liveForumComments,...liveRavenComments);
  }
  return Response.json(snapshot, {
    headers: { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" },
  });
}
