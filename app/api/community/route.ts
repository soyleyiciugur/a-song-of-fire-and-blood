import community from "@/data/flea-bottom.json";
import updates from "@/data/update-notes.json";
import forum from "@/data/forum.json";
import chapters from "@/data/chapters.json";
import { publishCommunity } from "@/lib/communityPublication.mjs";
import { createClient } from "@/lib/supabase/server";
import type { ForumSource } from "@/lib/communityTypes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function safeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export async function GET() {
  const snapshot = publishCommunity(
    community,
    updates,
    Date.now(),
    forum as unknown as ForumSource,
    chapters,
  );

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    try {
      const supabase = await createClient();

      let user = null;
      try {
        const auth = await supabase.auth.getUser();
        user = auth.data.user ?? null;
      } catch (error) {
        console.error("[community] auth lookup failed; continuing anonymously", error);
      }

      const [profilesResult, threadsResult, postsResult, ravenResult] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("forum_threads").select("*").order("created_at"),
        supabase.from("forum_posts").select("*").order("created_at"),
        supabase.from("raven_comments").select("*").order("created_at"),
      ]);

      if (profilesResult.error) console.error("[community] profiles query failed", profilesResult.error);
      if (threadsResult.error) console.error("[community] forum_threads query failed", threadsResult.error);
      if (postsResult.error) console.error("[community] forum_posts query failed", postsResult.error);
      if (ravenResult.error) console.error("[community] raven_comments query failed", ravenResult.error);

      const profiles = profilesResult.data ?? [];
      const threads = threadsResult.data ?? [];
      const posts = postsResult.data ?? [];
      const raven = ravenResult.data ?? [];

      const liveUsers = profiles.map((profile) => {
        const username = safeText(profile.username, "member");
        const displayName = safeText(profile.display_name, username || "Member");
        return {
          id: profile.id,
          username,
          displayName,
          kind: "member" as const,
          bio: safeText(profile.bio),
          avatar: displayName.slice(0, 2).toUpperCase() || "??",
          avatarUrl: profile.avatar_url,
          color: "#65353d",
          profileHref: `/users/${username}`,
          role: profile.role,
        };
      });

      const existingUserIds = new Set(snapshot.users.map((person: { id: string }) => person.id));
      snapshot.users.push(...liveUsers.filter((person) => !existingUserIds.has(person.id)));

      const viewerRole = liveUsers.find((person) => person.id === user?.id)?.role;
      const mayModerate = viewerRole === "moderator" || viewerRole === "admin";

      const chapterBySlug = new Map(
        (chapters as { slug: string; title: string }[]).map((chapter) => [chapter.slug, chapter.title]),
      );

      const existingThreadIds = new Set(snapshot.forumThreads.map((thread: { id: string }) => thread.id));
      snapshot.forumThreads.push(
        ...threads.filter((thread) => !existingThreadIds.has(thread.id)).map((thread) => {
          const chapterTitle = thread.chapter_slug
            ? chapterBySlug.get(thread.chapter_slug) ?? null
            : null;
          const storedTitle = safeText(thread.title).trim();
          const title = chapterTitle
            ? `${chapterTitle} — Discussion Thread`
            : storedTitle || "Tavern Discussion";

          return {
            id: thread.id,
            title,
            body: safeText(thread.body),
            category: thread.category,
            chapterSlug: thread.chapter_slug,
            chapterTitle,
            spoilerThrough: thread.spoiler_through ?? "current discussion",
            authorId:
              thread.user_author_id ??
              thread.legacy_author_id ??
              thread.character_id ??
              "",
            publishedAt: thread.created_at,
            authorType: thread.author_type,
            canEdit:
              !!user &&
              (thread.user_author_id === user.id || mayModerate),
          };
        }),
      );

      let favorCounts = new Map<string, number>();
      if (posts.length) {
        const favorsResult = await supabase.rpc("member_like_counts", {
          kind: "post",
          targets: posts.map((post) => post.id),
        });

        if (favorsResult.error) {
          console.error("[community] member_like_counts failed; rendering posts without favor totals", favorsResult.error);
        } else {
          favorCounts = new Map(
            (favorsResult.data ?? []).map((row: { target_id: string; total: number }) => [
              row.target_id,
              Number(row.total),
            ]),
          );
        }
      }

      const existingCommentIds = new Set(snapshot.comments.map((comment: { id: string }) => comment.id));
      snapshot.comments.push(
        ...posts.filter((post) => !existingCommentIds.has(post.id)).map((post) => ({
          id: post.id,
          entryId: post.thread_id,
          parentId: post.parent_id,
          body: safeText(post.body),
          authorId:
            post.user_author_id ??
            post.legacy_author_id ??
            post.character_id ??
            "",
          publishedAt: post.created_at,
          surface: "forum" as const,
          upvotes: favorCounts.get(post.id) ?? 0,
          authorType: post.author_type,
          canEdit:
            !!user &&
            (post.user_author_id === user.id || mayModerate),
        })),
        ...raven.filter((comment) => !existingCommentIds.has(comment.id)).map((comment) => ({
          id: comment.id,
          entryId: comment.entry_id,
          parentId: comment.parent_id,
          body: safeText(comment.body),
          authorId:
            comment.user_author_id ??
            comment.legacy_author_id ??
            comment.character_id ??
            "",
          publishedAt: comment.created_at,
          authorType: comment.author_type,
          canEdit:
            !!user &&
            (comment.user_author_id === user.id || mayModerate),
        })),
      );
    } catch (error) {
      // Community JSON remains usable even if the live Supabase overlay has a transient
      // problem. Never turn the entire feed into a 500 because one live query failed.
      console.error("[community] live overlay failed; returning static snapshot", error);
    }
  }

  return Response.json(snapshot, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
