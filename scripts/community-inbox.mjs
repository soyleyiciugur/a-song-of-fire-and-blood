import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const tmpDir = path.join(root, '.tmp');
const inboxPath = path.join(tmpDir, 'community-inbox.json');
const statePath = path.join(tmpDir, 'community-workflow-state.json');

function loadLocalEnv() {
  const envPath = path.join(root, '.env.local');

  if (!fs.existsSync(envPath)) return;

  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();

    if (!line || line.startsWith('#')) continue;

    const i = line.indexOf('=');
    if (i < 1) continue;

    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function readJson(file, fallback) {
  try {
    return JSON.parse(
      fs
        .readFileSync(path.join(root, file), 'utf8')
        .replace(/^\uFEFF/, '')
    );
  } catch {
    return fallback;
  }
}

loadLocalEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
      'Add them to .env.local before running community:inbox.'
  );

  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const state = readJson('.tmp/community-workflow-state.json', {
  lastFetchedAt: null,
});

const flea = readJson('data/flea-bottom.json', {
  comments: [],
});

const forum = readJson('data/forum.json', {
  threads: [],
  comments: [],
});

const gallery = readJson('data/gallery.json', []);
const chapters = readJson('data/chapters.json', []);

const editorialReplies = new Set([
  ...(flea.comments ?? [])
    .filter(
      (comment) =>
        comment.parentSource === 'supabase' &&
        comment.parentId
    )
    .map((comment) => comment.parentId),

  ...(forum.comments ?? [])
    .filter(
      (comment) =>
        comment.parentSource === 'supabase' &&
        comment.parentId
    )
    .map((comment) => comment.parentId),
]);

const editorialThreadTargets = new Set(
  (forum.comments ?? [])
    .filter((comment) => comment.liveThreadId)
    .map((comment) => comment.liveThreadId)
);

const args = process.argv.slice(2);

const sinceArg = args.find((arg) =>
  arg.startsWith('--since=')
);

const fetchAll = args.includes('--all');
const markSeen = args.includes('--mark-seen');

const since = fetchAll
  ? null
  : sinceArg
    ? sinceArg.slice('--since='.length)
    : state.lastFetchedAt || null;

const selectSince = (
  query,
  column = 'created_at'
) => {
  return since
    ? query.gt(column, since)
    : query;
};

const [
  profilesRes,
  ravenRes,
  threadsRes,
  postsRes,
] = await Promise.all([
  supabase
    .from('profiles')
    .select(
      'id,username,display_name,avatar_url,role,created_at'
    ),

  selectSince(
    supabase
      .from('raven_comments')
      .select(
        'id,entry_id,parent_id,body,user_author_id,created_at,is_visible'
      )
      .eq('author_type', 'user')
      .eq('is_visible', true)
      .order('created_at', {
        ascending: true,
      })
  ),

  selectSince(
    supabase
      .from('forum_threads')
      .select(
        'id,title,body,category,user_author_id,created_at,is_visible'
      )
      .eq('author_type', 'user')
      .eq('is_visible', true)
      .order('created_at', {
        ascending: true,
      })
  ),

  selectSince(
    supabase
      .from('forum_posts')
      .select(
        'id,thread_id,parent_id,body,user_author_id,created_at,is_visible'
      )
      .eq('author_type', 'user')
      .eq('is_visible', true)
      .order('created_at', {
        ascending: true,
      })
  ),
]);

for (const [name, result] of [
  ['profiles', profilesRes],
  ['raven_comments', ravenRes],
  ['forum_threads', threadsRes],
  ['forum_posts', postsRes],
]) {
  if (result.error) {
    console.error(
      `Could not read ${name}: ${result.error.message}`
    );

    process.exit(1);
  }
}

const profiles = new Map(
  (profilesRes.data ?? []).map((profile) => [
    profile.id,
    profile,
  ])
);

const galleryMap = new Map(
  (gallery ?? []).map((entry) => [
    entry.id,
    entry,
  ])
);

const chapterMap = new Map(
  (chapters ?? []).map((chapter) => [
    chapter.slug,
    chapter,
  ])
);

const liveThreadsAll = await supabase
  .from('forum_threads')
  .select(
    'id,title,body,category,chapter_slug,user_author_id,created_at,is_visible'
  )
  .eq('is_visible', true);

if (liveThreadsAll.error) {
  console.error(
    `Could not read forum thread context: ${liveThreadsAll.error.message}`
  );

  process.exit(1);
}

const threadMap = new Map(
  (liveThreadsAll.data ?? []).map((thread) => [
    thread.id,
    thread,
  ])
);

const author = (id) => {
  const profile = profiles.get(id);

  if (profile) {
    return {
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      role: profile.role,
    };
  }

  return {
    id,
    username: 'unknown',
    displayName: 'Unknown member',
    role: 'member',
  };
};

const raven = (ravenRes.data ?? []).map(
  (comment) => {
    const galleryEntry = galleryMap.get(
      comment.entry_id
    );

    return {
      kind: 'raven-comment',
      id: comment.id,
      createdAt: comment.created_at,
      author: author(
        comment.user_author_id
      ),
      body: comment.body,
      entryId: comment.entry_id,
      entry: galleryEntry
        ? {
            id: comment.entry_id,
            caption:
              galleryEntry.caption ?? '',
            category:
              galleryEntry.category ?? '',
          }
        : {
            id: comment.entry_id,
          },
      parentId: comment.parent_id,
      addressedByEditorialReply:
        editorialReplies.has(comment.id),
    };
  }
);

const threads = (threadsRes.data ?? []).map(
  (thread) => ({
    kind: 'forum-thread',
    id: thread.id,
    createdAt: thread.created_at,
    author: author(
      thread.user_author_id
    ),
    title: thread.title,
    body: thread.body,
    category: thread.category,
    addressedByEditorialActivity:
      editorialThreadTargets.has(thread.id),
  })
);

const posts = (postsRes.data ?? []).map(
  (post) => {
    const thread = threadMap.get(
      post.thread_id
    );

    return {
      kind: 'forum-post',
      id: post.id,
      createdAt: post.created_at,
      author: author(
        post.user_author_id
      ),
      body: post.body,
      threadId: post.thread_id,
      thread: thread
        ? {
            id: thread.id,
            title: thread.title,
            category: thread.category,
            chapterSlug:
              thread.chapter_slug,
            chapterTitle:
              thread.chapter_slug
                ? chapterMap.get(
                    thread.chapter_slug
                  )?.title ?? null
                : null,
          }
        : {
            id: post.thread_id,
          },
      parentId: post.parent_id,
      addressedByEditorialReply:
        editorialReplies.has(post.id),
    };
  }
);

const activity = [
  ...raven,
  ...threads,
  ...posts,
].sort(
  (a, b) =>
    Date.parse(a.createdAt) -
    Date.parse(b.createdAt)
);

const generatedAt = new Date().toISOString();

const output = {
  generatedAt,
  since,
  note:
    'Public community authoring context only. No email/auth tokens/private DM data are exported.',
  counts: {
    total: activity.length,
    unaddressed: activity.filter(
      (item) =>
        !item.addressedByEditorialReply &&
        !item.addressedByEditorialActivity
    ).length,
    ravenComments: raven.length,
    forumThreads: threads.length,
    forumPosts: posts.length,
  },
  activity,
};

fs.mkdirSync(tmpDir, {
  recursive: true,
});

fs.writeFileSync(
  inboxPath,
  JSON.stringify(
    output,
    null,
    2
  ) + '\n'
);

if (markSeen) {
  fs.writeFileSync(
    statePath,
    JSON.stringify(
      {
        lastFetchedAt: generatedAt,
      },
      null,
      2
    ) + '\n'
  );
}

console.log(
  `Community inbox written to ${path.relative(
    root,
    inboxPath
  )} ` +
    `(${output.counts.total} items; ` +
    `${output.counts.unaddressed} not yet addressed by editorial activity).`
);

if (markSeen) {
  console.log(
    `Workflow checkpoint advanced to ${generatedAt}.`
  );
} else {
  console.log(
    'Workflow checkpoint was NOT advanced.'
  );
}