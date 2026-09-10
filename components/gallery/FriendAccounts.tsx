"use client";

import { useEffect, useId, useRef, useState } from 'react';
import MiniPortrait from '@/components/MiniPortrait';
import { gutterUserMap, type GutterUser } from '@/lib/fleaBottom';
import styles from './gutterComments.module.css';

export default function FriendAccounts({user}: {user:GutterUser}) {
  const [open,setOpen] = useState(false);
  const [pinned,setPinned] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const friends = (user.friendIds ?? []).map(id=>gutterUserMap.get(id)).filter((friend):friend is GutterUser=>!!friend);
  useEffect(()=>{
    if(!open) return;
    const outside=(event:PointerEvent)=>{
      if(!container.current?.contains(event.target as Node)){setOpen(false);setPinned(false);}
    };
    const escape=(event:KeyboardEvent)=>{
      if(event.key!=='Escape')return;
      event.preventDefault();
      event.stopPropagation();
      trigger.current?.focus({preventScroll:true});
      setOpen(false);
      setPinned(false);
    };
    document.addEventListener('pointerdown',outside);
    document.addEventListener('keydown',escape,true);
    return ()=>{
      document.removeEventListener('pointerdown',outside);
      document.removeEventListener('keydown',escape,true);
    };
  },[open]);
  return <div ref={container} className={styles.friends}
    onPointerEnter={event=>{if(event.pointerType==='mouse')setOpen(true);}}
    onPointerLeave={()=>{if(!pinned && !container.current?.contains(document.activeElement))setOpen(false);}}
    onFocus={()=>setOpen(true)}
    onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget)){setOpen(false);setPinned(false);}}}>
    <button ref={trigger} type="button" className={styles.friendToggle} aria-expanded={open} aria-controls={id}
      onClick={()=>{setPinned(!pinned);setOpen(!pinned);}}>
      <span>{friends.length} {friends.length===1?'friend':'friends'}</span> <span aria-hidden="true">{open?'⌃':'⌄'}</span>
    </button>
    <div id={id} hidden={!open} className={styles.friendPanel} role="region" aria-label={`Friends of @${user.username}`}>
      {open && (friends.length ? <ul className={styles.friendList}>{friends.map(friend=><li key={friend.id}>
        <details className={styles.friendAccount}>
          <summary>
            {friend.account?.type==='character' ? <MiniPortrait id={friend.account.characterId} alt={friend.displayName ?? friend.username} size={24}/> : <span className={styles.friendAvatar} style={{backgroundColor:friend.color}} aria-hidden="true">{friend.avatar}</span>}
            <span className={styles.username}>@{friend.username}</span>
          </summary>
          <div className={styles.friendBio}>
            {friend.displayName && <strong>{friend.displayName}</strong>}
            <span className={styles.badge}>{friend.kind==='fictional'?'Fictional account':'Community member'}</span>
            <p>{friend.bio}</p>
            {friend.current && <p>{friend.current.label}: {friend.current.value}</p>}
          </div>
        </details>
      </li>)}</ul> : <p className={styles.activity}>No friends yet.</p>)}
    </div>
  </div>;
}
