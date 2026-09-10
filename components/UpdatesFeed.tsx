import type { CommunityUpdate } from '@/lib/communityTypes';
import { groupNotifications } from '@/lib/notificationTime.mjs';
import styles from './updatesFeed.module.css';

const fullDate=new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Istanbul'});
const dayDate=new Intl.DateTimeFormat('en-GB',{dateStyle:'long',timeZone:'Europe/Istanbul'});

export default function UpdatesFeed({updates,now}:{updates:CommunityUpdate[];now:number}){
  return <div data-update-feed>{groupNotifications(updates,now).map(({label,entries})=><section key={label} className={styles.group} aria-label={label}>
    <h2 className={styles.heading}>{label}</h2>
    <ol className={styles.list}>{entries.map((update:CommunityUpdate)=><li key={update.id} className={styles.entry} data-update-id={update.id}>
      <time dateTime={update.publishedAt}>{update.dateOnly?dayDate.format(new Date(update.publishedAt)):`${fullDate.format(new Date(update.publishedAt))} TRT`}</time>
      <h3>{update.title}</h3>
      {update.body&&<p>{update.body}</p>}
      {!!update.items?.length&&<ul>{update.items.map(item=><li key={item}>{item}</li>)}</ul>}
    </li>)}</ol>
  </section>)}{!updates.length&&<p>No update notes yet.</p>}</div>;
}
