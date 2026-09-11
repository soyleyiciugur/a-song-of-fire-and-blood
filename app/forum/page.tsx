"use client";

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import MiniPortrait from '@/components/MiniPortrait';
import FriendAccounts from '@/components/gallery/FriendAccounts';
import { useCommunity, refreshCommunity } from '@/lib/communityStore';
import { getGutterIdentity, getGutterUserStats } from '@/lib/fleaBottom';
import { getCommentLink } from '@/lib/communityLinks';
import type { GutterComment, GutterUser } from '@/lib/communityTypes';
import styles from './forum.module.css';
import Composer from '@/components/community/Composer';
import ContentActions from '@/components/community/ContentActions';
import LikeButton from '@/components/community/LikeButton';
import { buildCommentTree, countDescendants, type CommentTreeNode } from '@/lib/commentThreads';

const dateLabel=(date:string)=>new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Istanbul'}).format(new Date(date));
function Account({user}:{user:GutterUser}) {
  const identity=getGutterIdentity(user);
  const stats=getGutterUserStats(user.id);
  return <details className={styles.account}><summary>
    {user.account?.type==='character'?<MiniPortrait id={user.account.characterId} alt={identity?.name??user.username} size={28}/>:user.avatarUrl?<img className={styles.avatar} src={user.avatarUrl} alt=""/>:<span className={styles.avatar} style={{backgroundColor:user.color}} aria-hidden="true">{user.avatar}</span>}
    <span>@{user.username}</span>{identity&&<span className={styles.verified} title={`Verified ${identity.type} account · fictional`} aria-label={`Verified ${identity.type} account`}>✓</span>}
    {user.id==='cast-jacaelon-targaryen'&&<span className={styles.mod}>MOD</span>}
  </summary><div className={styles.profile}>
    <strong>{user.displayName??user.username}</strong><span className={styles.muted}> · {user.kind==='fictional'?'Fictional account':'Community member'}</span>
    <p>{user.bio}</p>{identity?.href&&<Link href={identity.href}>{identity.name} ↗</Link>}
    {user.current&&<p>{user.current.label}: {user.current.value}</p>}
    <p className={styles.muted}>{stats.comments} comments across {stats.posts} posts</p>{user.profileHref&&<Link href={user.profileHref}>View profile →</Link>}<FriendAccounts user={user}/>
  </div></details>;
}
function Rewards({comment}:{comment:GutterComment}) {
  return <div className={styles.rewards}><Link href={getCommentLink(comment)} className={styles.permalink}>Permalink</Link></div>;
}
function ForumComment({node,users,comments,threadId,target}:{node:CommentTreeNode;users:Map<string,GutterUser>;comments:GutterComment[];threadId:string;target:string|null}) {
  const {comment,children}=node;
  const [expanded,setExpanded]=useState(true);
  const user=users.get(comment.authorId);
  if(!user)return <>{children.map(child=><ForumComment key={child.comment.id} node={child} users={users} comments={comments} threadId={threadId} target={target}/>)}</>;
  const parent=comments.find(c=>c.id===comment.parentId);
  const descendantCount=countDescendants(node);
  return <li id={`comment-${comment.id}`} tabIndex={-1} data-comment-id={comment.id} className={`${styles.comment} ${comment.moderation?styles.warning:''}`} data-highlighted={target===comment.id||undefined}>
      <article className={styles.commentContent}>
        {parent&&<Link className={styles.replyTo} href={getCommentLink(parent)}>↳ Replying to @{users.get(parent.authorId)?.username}</Link>}
        <Account user={user}/><time className={styles.time} dateTime={comment.publishedAt}>{dateLabel(comment.publishedAt)} TRT</time>
        {comment.moderation&&<p className={styles.modNote}>Moderator warning · {comment.moderation.rule}</p>}
        <p className={styles.body}>{comment.body}</p><div className={styles.commentMetaRow}><LikeButton kind="post" id={comment.id} legacyReactorIds={comment.legacyFavorIds}/><Rewards comment={comment}/></div><Composer kind="post" threadId={threadId} parentId={comment.id}/>{comment.canEdit&&<ContentActions kind="post" id={comment.id} body={comment.body}/>} 
        {children.length>0&&<button type="button" className={styles.replyToggle} aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}>{expanded?'Hide':'Show'} {descendantCount} {descendantCount===1?'reply':'replies'}</button>}
      </article>
    {children.length>0&&expanded&&<ol className={styles.replies} aria-label={`Replies to @${user.username}`}>{children.map(child=><ForumComment key={child.comment.id} node={child} users={users} comments={comments} threadId={threadId} target={target}/>)}</ol>}
  </li>;
}

function Forum() {
  const data=useCommunity();
  const params=useSearchParams();
  const threadId=params.get('thread');
  const target=params.get('comment');
  const handled=useRef<string|null>(null);
  const [filter,setFilter]=useState('all');
  const [sort,setSort]=useState('conversation');
  const users=new Map(data.users.map(u=>[u.id,u]));
  const thread=data.forumThreads.find(t=>t.id===threadId);
  const comments=data.comments.filter(c=>c.surface==='forum'&&c.entryId===threadId);
  const groups=buildCommentTree(comments);
  if(sort==='top')groups.sort((a,b)=>(b.comment.upvotes??0)-(a.comment.upvotes??0));
  useEffect(()=>{
    if(!target){handled.current=null;return;}
    if(!comments.some(c=>c.id===target)||handled.current===target)return;
    const timer=setTimeout(()=>{const el=document.getElementById(`comment-${target}`);if(el){el.scrollIntoView({block:'center',behavior:'instant'});el.focus({preventScroll:true});handled.current=target;}},100);
    return()=>clearTimeout(timer);
  },[target,comments]);
  const filtered=data.forumThreads.filter(t=>filter==='all'||(filter==='chapters'?!!t.chapterSlug:!t.chapterSlug));
  const sorted=[...filtered].sort((a,b)=>{
    const latest=(id:string)=>Math.max(0,...data.comments.filter(c=>c.surface==='forum'&&c.entryId===id).map(c=>Date.parse(c.publishedAt)));
    return latest(b.id)-latest(a.id)||data.forumThreads.indexOf(b)-data.forumThreads.indexOf(a);
  });
  return <main className={styles.page}>
    <header className={styles.header}>
      {!threadId&&<div className={styles.banner}><Image src="/images/taverns/tavern-banner.jpeg" alt="Visenor, Gaelor and Jace Targaryen" fill sizes="(max-width: 980px) 100vw, 936px" preload className={styles.bannerImage}/></div>}
      <div className={styles.headerContent}><Link className={styles.eyebrow} href="/forum">TAVERNS</Link><h1>{thread?thread.title:'Taverns'}</h1><p className={styles.muted}>Pull up a chair by the hearth. Chapter tales, whispered theories and familiar faces await.</p></div>
    </header>
    <details className={styles.rules}><summary>House rules · Jace keeps the peace</summary><ol><li>Criticize the writing and the take. Personal attacks get a warning.</li><li>Stay within the thread’s spoiler limit. Label theories and headcanon.</li><li>No spam, repeated pile-ons or attempts to send people after another account.</li></ol><p>Sign in to post, reply and grant Favor to member contributions. Fictional regulars and awards are editorially managed.</p></details>
    {data.error&&<p role="status">{data.error} <button onClick={()=>void refreshCommunity()}>Retry</button></p>}
    {!data.loaded&&<p role="status">Opening the tavern doors…</p>}
    {threadId ? thread ? <>
      <Link href="/forum" className={styles.back}>← All tables</Link>
      <section className={styles.op}><div className={styles.meta}><span>{thread.category}</span><span>Spoilers through {thread.spoilerThrough.replaceAll('-',' ')}</span><time dateTime={thread.publishedAt}>{dateLabel(thread.publishedAt)} TRT</time></div>
        {users.get(thread.authorId)&&<Account user={users.get(thread.authorId)!}/>}<p className={styles.body}>{thread.body}</p>
        {thread.chapterSlug&&<Link href={`/chapters/${thread.chapterSlug}`} className={styles.readChapter}>Read {thread.chapterTitle} ↗</Link>}<LikeButton kind="thread" id={thread.id}/>{thread.canEdit&&<ContentActions kind="thread" id={thread.id} body={thread.body}/>}
      </section>
      <Composer kind="post" threadId={thread.id}/><div className={styles.discussionBar}><h2>{comments.length} comments</h2><label>Order <select value={sort} onChange={e=>setSort(e.target.value)}><option value="conversation">Conversation</option><option value="top">Most Favored</option></select></label></div>
      {target&&!comments.some(c=>c.id===target)&&data.loaded&&<p role="status">This comment is not available yet.</p>}
      <ol className={styles.comments}>{groups.map(node=><ForumComment key={node.comment.id} node={node} users={users} comments={comments} threadId={thread.id} target={target}/>)}</ol>
    </>:data.loaded&&<p>Thread unavailable. <Link href="/forum">Back to Taverns</Link></p> : <>
      <div className={styles.filters} aria-label="Thread categories">{[['all','All tables'],['chapters','Chapter discussions'],['other','Theory & community']].map(([value,label])=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}</div>
      <ol className={styles.threads}>{sorted.map(t=>{
        const replies=data.comments.filter(c=>c.surface==='forum'&&c.entryId===t.id);
        return <li key={t.id}><Link href={`/forum?thread=${encodeURIComponent(t.id)}`} className={styles.threadCard}><span className={styles.category}>{t.category}</span><h2>{t.title}</h2><p>{t.body.split('\n')[0]}</p><div className={styles.meta}><span>@{users.get(t.authorId)?.username}</span><span>{replies.length} comments</span><span>{new Set(replies.map(c=>c.authorId)).size} participants</span></div></Link></li>;
      })}</ol>
      <Composer kind="thread"/>
    </>}
  </main>;
}
export default function ForumPage(){return <Suspense fallback={<main className={styles.page}>Opening the tavern doors…</main>}><Forum/></Suspense>;}
