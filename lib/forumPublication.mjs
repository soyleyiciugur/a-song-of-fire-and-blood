export function publishForum(forum, chapters, now) {
  const due=item=>Number.isFinite(Date.parse(item.publishedAt)) && Date.parse(item.publishedAt)<=now;
  const threads=forum.threads.filter(due).map(thread=>{
    const chapter=chapters.find(c=>c.slug===thread.chapterSlug);
    return {...thread,title:chapter ? `${chapter.title} — Discussion thread` : thread.title,chapterTitle:chapter?.title ?? null};
  });
  const threadIds=new Set(threads.map(t=>t.id));
  const visible=new Set();
  const comments=[];
  // Authoring validation requires parents before descendants, at any supported depth.
  for(const comment of forum.comments){
    if(!threadIds.has(comment.entryId) || !due(comment) || (comment.parentId && !visible.has(comment.parentId)))continue;
    visible.add(comment.id);
    const {id,entryId,authorId,parentId,body,publishedAt,moderation}=comment;
    comments.push({id,entryId,authorId,parentId,body,publishedAt,moderation,surface:'forum',upvotes:comment.upvoterIds.length,hasocash:comment.awards.reduce((n,a)=>n+a.amount,0)});
  }
  return {threads,comments};
}
