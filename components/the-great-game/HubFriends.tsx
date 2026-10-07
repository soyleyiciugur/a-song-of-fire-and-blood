"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useSitePresence } from "@/components/community/SitePresence";
import type { HubData, HubFriend } from "@/lib/the-great-game/hub";
import type { StoredDeck } from "@/lib/the-great-game/stored-decks";
import type { GreatGameOnlineMatchView } from "@/lib/the-great-game/online";
import QuickRaven from "@/components/direct-raven/QuickRaven";
import RavenIcon from "@/components/direct-raven/RavenIcon";
import InviteFriend from "./InviteFriend";
import styles from "./play-hub.module.css";

export default function HubFriends({ data, guest, error, decks, deckId, onDeckChange, onInvited }: {
  data: HubData | null; guest: boolean; error: string; decks: StoredDeck[]; deckId: string;
  onDeckChange: (id: string) => void; onInvited: (match: GreatGameOnlineMatchView) => void;
}) {
  const presence = useSitePresence();
  const [invite, setInvite] = useState<HubFriend | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  return <>
    <aside className={styles.friends} id="hub-friends" aria-label="Friends in The Great Game">
      <div className={styles.panelHeading}><h2>Friends at the inn</h2><span>{data?.friends.length ?? 0}</span></div>
      <div className={styles.friendList}>
        {data?.friends.map(friend => <div key={friend.id} className={styles.friend}>
          <Link href={`/users/${friend.username}`} className={styles.friendIdentity}>
            <span className={styles.avatar}>{friend.avatar_url ? <Image src={friend.avatar_url} alt="" width={38} height={38} unoptimized /> : (friend.display_name || friend.username).slice(0, 2)}</span>
            <span><strong>{friend.display_name || friend.username}</strong><small><i data-online={presence.ready && presence.ids.has(friend.id)} />{!presence.ready ? "Status unavailable" : presence.ids.has(friend.id) ? friend.matchId ? "Online · In a match" : "Online" : "Offline"}</small></span>
          </Link>
          <div className={styles.friendActions}>
          {friend.matchId ? <Link href={`/cards/spectate/${friend.matchId}`} aria-label={`Spectate ${friend.display_name}`} title="Watch this table">Spectate</Link> : <button type="button" onClick={() => { setMessage(null); setInvite(friend); }} aria-label={`Invite ${friend.display_name}`} title="Invite to a private table"><span className={styles.challengeIcon} aria-hidden="true">⚔</span><span>Invite</span></button>}
            <button type="button" onClick={() => { setInvite(null); setMessage(current => current === friend.username ? null : friend.username); }} aria-label={`Message ${friend.display_name}`} aria-expanded={message === friend.username} title="Quick message"><RavenIcon size={17} /></button>
          </div>
        </div>)}
        {!data?.friends.length && <p className={styles.empty}>{guest ? <Link href="/login">Sign in. I&apos;ll save you a seat. — Mara</Link> : error || (data ? "No familiar faces yet. There is always room for another. — Aldren" : "Checking the guest book…")}</p>}
        {!!data && error && <p role="status" className={styles.status}>{error}</p>}
      </div>
    </aside>
    {invite && <InviteFriend friend={invite} decks={decks} deckId={deckId} onDeckChange={onDeckChange} onClose={() => setInvite(null)} onInvited={onInvited} />}
    {message && <QuickRaven key={message} username={message} onClose={() => setMessage(null)} />}
  </>;
}
