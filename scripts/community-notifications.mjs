import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { createECDH, createPrivateKey, hkdfSync, randomBytes, sign, createCipheriv } from 'node:crypto';

const root = process.cwd();

function loadLocalEnv() {
  const file = path.join(root, '.env.local');
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '')); }
  catch { return fallback; }
}

loadLocalEnv();

const productionBuild = process.argv.includes('--production-build');
if (productionBuild && process.env.VERCEL_ENV !== 'production') {
  console.log('Community notifications: preview/non-Vercel build; skipping production delivery.');
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.log('Community notifications skipped: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(0);
}

const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const forum = readJson('data/forum.json', { threads: [], comments: [] });
const flea = readJson('data/flea-bottom.json', { users: [], comments: [] });
const gallery = readJson('data/gallery.json', []);
const copy = readJson('data/notification-copy.json', {});
const now = Date.now();
const lookbackHours = Math.max(1, Number(process.env.COMMUNITY_NOTIFICATION_LOOKBACK_HOURS || 24));
const since = now - lookbackHours * 60 * 60 * 1000;
const due = (value) => {
  const time = Date.parse(value || '');
  return Number.isFinite(time) && time <= now && time >= since;
};

const DEFAULT_FLAGS = {
  tavern_answers: true,
  tavern_favor: true,
  ravens_eye_answers: true,
  ravens_eye_likes: true,
  direct_ravens: true,
  guild_parley: true,
  ravens_eye_images: true,
  gutter_memes: true,
  gutter_reels: true,
  new_chapters: true,
  guestbook_entries: true,
  guestbook_replies: true,
  new_tavern_threads: false,
  tavern_participant_activity: false,
  ravens_eye_root_comments: false,
  realm_notices: true,
};
const KIND_META = {
  tavern_answer: ['tavern', 'tavern_answers'],
  ravens_eye_answer: ['ravens-eye', 'ravens_eye_answers'],
  new_tavern_thread: ['tavern', 'new_tavern_threads'],
  tavern_participant_activity: ['tavern', 'tavern_participant_activity'],
  ravens_eye_root_comment: ['ravens-eye', 'ravens_eye_root_comments'],
};
const MASCOTS = {
  mara: { name: 'Mara', portrait: '/images/miniportraits/MaraMiniPortrait.webp' },
  aldren: { name: 'Aldren', portrait: '/images/miniportraits/AldrenMiniPortrait.webp' },
};

function flags(row) {
  const source = row?.preferences && typeof row.preferences === 'object' ? row.preferences : {};
  return Object.fromEntries(Object.entries(DEFAULT_FLAGS).map(([key, fallback]) => [key, typeof source[key] === 'boolean' ? source[key] : fallback]));
}
function normalizePrefs(userId, row) {
  return {
    user_id: userId,
    preferences: flags(row),
    last_mascot: row?.last_mascot === 'mara' || row?.last_mascot === 'aldren' ? row.last_mascot : null,
    mascot_streak: Math.max(0, Number(row?.mascot_streak ?? 0)),
    mara_count: Math.max(0, Number(row?.mara_count ?? 0)),
    aldren_count: Math.max(0, Number(row?.aldren_count ?? 0)),
    last_variants: row?.last_variants && typeof row.last_variants === 'object' ? row.last_variants : {},
  };
}
function weightedPick(items) {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [item, weight] of items) { roll -= weight; if (roll <= 0) return item; }
  return items.at(-1)?.[0] ?? 'mara';
}
function chooseMascot(pref) {
  if (pref.last_mascot && pref.mascot_streak >= 2) return pref.last_mascot === 'mara' ? 'aldren' : 'mara';
  let mara = 1, aldren = 1;
  const balance = pref.mara_count - pref.aldren_count;
  if (balance > 0) aldren += Math.min(4, balance * .8);
  if (balance < 0) mara += Math.min(4, -balance * .8);
  if (pref.last_mascot === 'mara') aldren += 2.5 + pref.mascot_streak * 1.5;
  if (pref.last_mascot === 'aldren') mara += 2.5 + pref.mascot_streak * 1.5;
  return weightedPick([['mara', mara], ['aldren', aldren]]);
}
function render(kind, mascot, pref, actorName, sourceLabel) {
  const options = copy?.[kind]?.[mascot] ?? [{ title: 'Word from the realm', body: 'Fresh words await you.' }];
  const key = `${kind}:${mascot}`;
  const previous = Number(pref.last_variants[key]);
  const pool = options.map((_, i) => i).filter((i) => i !== previous);
  const index = (pool.length ? pool : options.map((_, i) => i))[Math.floor(Math.random() * (pool.length || options.length))] ?? 0;
  const template = options[index] ?? options[0];
  const replace = (value) => String(value).replaceAll('{actor}', actorName || 'Someone').replaceAll('{source}', sourceLabel || 'the realm');
  return { index, title: replace(template.title), body: replace(template.body) };
}
function sourceBase(entry) {
  const src = String(entry?.src ?? '').split(/[?#]/)[0];
  if (/\.(mp4|webm|mov)$/i.test(src)) return '/ravens-eye/reels';
  if (entry?.category === 'fleabottom') return '/ravens-eye/memes';
  return '/ravens-eye';
}
function galleryLabel(id) {
  const entry = gallery.find((item) => item.id === id);
  return entry?.caption?.trim().split('\n')[0].slice(0, 130) || "The Raven's Eye";
}
function ravenHref(entryId, commentId) {
  const entry = gallery.find((item) => item.id === entryId);
  const base = sourceBase(entry);
  return `${base}?item=${encodeURIComponent(entryId)}&comment=${encodeURIComponent(commentId)}#comment-${encodeURIComponent(commentId)}`;
}
function forumHref(threadId, commentId) {
  return `/forum?thread=${encodeURIComponent(threadId)}&comment=${encodeURIComponent(commentId)}#comment-${encodeURIComponent(commentId)}`;
}

const actorMap = new Map((flea.users ?? []).map((user) => [user.id, user.displayName || user.username || user.id]));
const staticThreads = new Map((forum.threads ?? []).map((thread) => [thread.id, thread]));

const [{ data: prefRows }, { data: profiles }] = await Promise.all([
  supabase.from('notification_preferences').select('*'),
  supabase.from('profiles').select('id'),
]);
const prefMap = new Map((prefRows ?? []).map((row) => [row.user_id, normalizePrefs(row.user_id, row)]));
for (const profile of profiles ?? []) if (!prefMap.has(profile.id)) prefMap.set(profile.id, normalizePrefs(profile.id, null));

const forumReplyCandidates = (forum.comments ?? []).filter((comment) => comment.parentSource === 'supabase' && comment.parentId && due(comment.publishedAt));
const ravenReplyCandidates = (flea.comments ?? []).filter((comment) => comment.parentSource === 'supabase' && comment.parentId && due(comment.publishedAt));
const forumParentIds = [...new Set(forumReplyCandidates.map((comment) => comment.parentId))];
const ravenParentIds = [...new Set(ravenReplyCandidates.map((comment) => comment.parentId))];
const liveThreadIds = [...new Set((forum.comments ?? []).filter((comment) => due(comment.publishedAt)).map((comment) => comment.liveThreadId || comment.entryId).filter(Boolean))];

const [forumParentsRes, ravenParentsRes, liveThreadsRes, liveParticipantsRes] = await Promise.all([
  forumParentIds.length ? supabase.from('forum_posts').select('id,user_author_id,body,thread_id').in('id', forumParentIds) : { data: [] },
  ravenParentIds.length ? supabase.from('raven_comments').select('id,user_author_id,body,entry_id').in('id', ravenParentIds) : { data: [] },
  liveThreadIds.length ? supabase.from('forum_threads').select('id,title,user_author_id').in('id', liveThreadIds) : { data: [] },
  liveThreadIds.length ? supabase.from('forum_posts').select('thread_id,user_author_id').in('thread_id', liveThreadIds).not('user_author_id', 'is', null) : { data: [] },
]);
const forumParents = new Map((forumParentsRes.data ?? []).map((row) => [row.id, row]));
const ravenParents = new Map((ravenParentsRes.data ?? []).map((row) => [row.id, row]));
const liveThreads = new Map((liveThreadsRes.data ?? []).map((row) => [row.id, row]));
const participants = new Map();
for (const row of liveParticipantsRes.data ?? []) {
  if (!row.user_author_id) continue;
  if (!participants.has(row.thread_id)) participants.set(row.thread_id, new Set());
  participants.get(row.thread_id).add(row.user_author_id);
}
for (const row of liveThreadsRes.data ?? []) if (row.user_author_id) {
  if (!participants.has(row.id)) participants.set(row.id, new Set());
  participants.get(row.id).add(row.user_author_id);
}

function preferenceEnabled(userId, kind) {
  const [, key] = KIND_META[kind];
  return (prefMap.get(userId) ?? normalizePrefs(userId, null)).preferences[key] !== false;
}
function explicitPreferenceEnabled(userId, kind) {
  const [, key] = KIND_META[kind];
  const row = (prefRows ?? []).find((item) => item.user_id === userId);
  return Boolean(row && flags(row)[key] === true);
}

const events = [];
for (const comment of forumReplyCandidates) {
  const parent = forumParents.get(comment.parentId);
  if (!parent?.user_author_id) continue;
  const threadId = comment.liveThreadId || comment.entryId || parent.thread_id;
  const thread = liveThreads.get(threadId) || staticThreads.get(threadId);
  events.push({
    eventKey: `npc:forum-reply:${comment.id}:${parent.user_author_id}`,
    recipient: parent.user_author_id,
    kind: 'tavern_answer',
    actorName: actorMap.get(comment.authorId) || comment.authorId,
    sourceLabel: thread?.title || 'Tavern discussion',
    href: forumHref(threadId, comment.id),
    publishedAt: comment.publishedAt,
    groupKey: `npc:tavern:${threadId}:${parent.user_author_id}`,
    context: { threadId, threadTitle: thread?.title || 'Tavern discussion', parentId: comment.parentId, parentBody: parent.body, parentAuthorId: parent.user_author_id || parent.legacy_author_id || parent.character_id || null, commentId: comment.id, replyBody: comment.body },
  });
}
for (const comment of ravenReplyCandidates) {
  const parent = ravenParents.get(comment.parentId);
  if (!parent?.user_author_id) continue;
  events.push({
    eventKey: `npc:raven-reply:${comment.id}:${parent.user_author_id}`,
    recipient: parent.user_author_id,
    kind: 'ravens_eye_answer',
    actorName: actorMap.get(comment.authorId) || comment.authorId,
    sourceLabel: galleryLabel(comment.entryId),
    href: ravenHref(comment.entryId, comment.id),
    publishedAt: comment.publishedAt,
    groupKey: `npc:raven:${comment.entryId}:${parent.user_author_id}`,
    context: { entryId: comment.entryId, entryTitle: galleryLabel(comment.entryId), parentId: comment.parentId, parentBody: parent.body, parentAuthorId: parent.user_author_id || parent.legacy_author_id || parent.character_id || null, commentId: comment.id, replyBody: comment.body },
  });
}

// Optional activity at Tavern tables the member has joined (default off).
for (const comment of (forum.comments ?? []).filter((item) => due(item.publishedAt))) {
  const threadId = comment.liveThreadId || comment.entryId;
  const people = participants.get(threadId) ?? new Set();
  const directRecipient = comment.parentSource === 'supabase' && comment.parentId ? forumParents.get(comment.parentId)?.user_author_id : null;
  const thread = liveThreads.get(threadId) || staticThreads.get(threadId);
  for (const recipient of people) {
    if (recipient === directRecipient || !explicitPreferenceEnabled(recipient, 'tavern_participant_activity')) continue;
    events.push({
      eventKey: `npc:forum-participant:${comment.id}:${recipient}`,
      recipient,
      kind: 'tavern_participant_activity',
      actorName: actorMap.get(comment.authorId) || comment.authorId,
      sourceLabel: thread?.title || 'Tavern discussion',
      href: forumHref(threadId, comment.id),
      publishedAt: comment.publishedAt,
      groupKey: `npc:tavern-participant:${threadId}:${recipient}`,
      context: (() => {
        const parent = comment.parentId ? forumParents.get(comment.parentId) : null;
        return {
          threadId,
          threadTitle: thread?.title || 'Tavern discussion',
          parentId: comment.parentId || null,
          parentBody: parent?.body || null,
          parentAuthorId: parent?.user_author_id || parent?.legacy_author_id || parent?.character_id || null,
          commentId: comment.id,
          replyBody: comment.body,
        };
      })(),
    });
  }
}

// Optional root comments beneath Raven's Eye sightings (default off).
for (const comment of (flea.comments ?? []).filter((item) => !item.parentId && due(item.publishedAt))) {
  for (const profile of profiles ?? []) {
    if (!explicitPreferenceEnabled(profile.id, 'ravens_eye_root_comment')) continue;
    events.push({
      eventKey: `npc:raven-root:${comment.id}:${profile.id}`,
      recipient: profile.id,
      kind: 'ravens_eye_root_comment',
      actorName: actorMap.get(comment.authorId) || comment.authorId,
      sourceLabel: galleryLabel(comment.entryId),
      href: ravenHref(comment.entryId, comment.id),
      publishedAt: comment.publishedAt,
      groupKey: `npc:raven-root:${comment.entryId}:${profile.id}`,
      context: { entryId: comment.entryId, entryTitle: galleryLabel(comment.entryId), commentId: comment.id, replyBody: comment.body },
    });
  }
}

// Optional new static Tavern discussions (default off).
for (const thread of (forum.threads ?? []).filter((item) => due(item.publishedAt))) {
  for (const profile of profiles ?? []) {
    if (!explicitPreferenceEnabled(profile.id, 'new_tavern_thread')) continue;
    events.push({
      eventKey: `npc:new-thread:${thread.id}:${profile.id}`,
      recipient: profile.id,
      kind: 'new_tavern_thread',
      actorName: actorMap.get(thread.authorId) || thread.authorId,
      sourceLabel: thread.title || 'Tavern discussion',
      href: `/forum?thread=${encodeURIComponent(thread.id)}`,
      publishedAt: thread.publishedAt,
      groupKey: `npc:new-thread:${profile.id}`,
      context: { threadId: thread.id, threadTitle: thread.title, threadBody: thread.body },
    });
  }
}

events.sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt));

function fromBase64Url(value) { return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64'); }
function toBase64Url(value) { return Buffer.from(value).toString('base64url'); }
function uint32(value) { const buffer = Buffer.alloc(4); buffer.writeUInt32BE(value); return buffer; }
function vapidAuthorization(endpoint) {
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT || 'mailto:admin@asofab.app';
  if (!publicKey || !privateKey) return null;
  const publicBytes = fromBase64Url(publicKey);
  if (publicBytes.length !== 65 || publicBytes[0] !== 4) return null;
  const x = publicBytes.subarray(1, 33), y = publicBytes.subarray(33, 65), d = fromBase64Url(privateKey);
  const key = createPrivateKey({ key: { kty:'EC', crv:'P-256', x:toBase64Url(x), y:toBase64Url(y), d:toBase64Url(d) }, format:'jwk' });
  const audience = new URL(endpoint).origin;
  const header = toBase64Url(Buffer.from(JSON.stringify({ typ:'JWT', alg:'ES256' })));
  const payload = toBase64Url(Buffer.from(JSON.stringify({ aud:audience, exp:Math.floor(Date.now()/1000)+12*60*60, sub:subject })));
  const unsigned = `${header}.${payload}`;
  const signature = sign('sha256', Buffer.from(unsigned), { key, dsaEncoding:'ieee-p1363' });
  return `vapid t=${unsigned}.${toBase64Url(signature)}, k=${publicKey}`;
}
async function sendPush(subscription, payload) {
  const authorization = vapidAuthorization(subscription.endpoint);
  if (!authorization) return null;
  const uaPublic = fromBase64Url(subscription.p256dh), authSecret = fromBase64Url(subscription.auth);
  const server = createECDH('prime256v1'); server.generateKeys();
  const serverPublic = server.getPublicKey(), sharedSecret = server.computeSecret(uaPublic);
  const info = Buffer.concat([Buffer.from('WebPush: info\0','utf8'), uaPublic, serverPublic]);
  const ikm = Buffer.from(hkdfSync('sha256', sharedSecret, authSecret, info, 32));
  const salt = randomBytes(16), cek = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16)), nonce = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12));
  const plaintext = Buffer.concat([Buffer.from(JSON.stringify(payload),'utf8'), Buffer.from([2])]);
  const cipher = createCipheriv('aes-128-gcm', cek, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
  const body = Buffer.concat([salt, uint32(4096), Buffer.from([serverPublic.length]), serverPublic, ciphertext]);
  return fetch(subscription.endpoint, { method:'POST', headers:{ Authorization:authorization, 'Content-Encoding':'aes128gcm', 'Content-Type':'application/octet-stream', TTL:'86400' }, body });
}

async function getPushSubscriptions(userId) {
  const [{ data: subscriptions }, unread] = await Promise.all([
    supabase.from('push_subscriptions').select('endpoint,p256dh,auth').eq('user_id', userId),
    supabase.from('site_notifications').select('id', { count:'exact', head:true }).eq('user_id', userId).is('read_at', null),
  ]);
  return { subscriptions: subscriptions ?? [], unreadCount: unread.count ?? undefined };
}

async function deliverPagePush(batch) {
  const { subscriptions, unreadCount } = await getPushSubscriptions(batch.recipient);
  if (!subscriptions.length) return false;
  if (!process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY || !process.env.WEB_PUSH_VAPID_PRIVATE_KEY) {
    console.log(`Community notifications: recorded ${batch.count} ${batch.source} event(s), but VAPID keys are unavailable for push delivery.`);
    return false;
  }

  const pref = prefMap.get(batch.recipient) ?? normalizePrefs(batch.recipient, null);
  const mascot = chooseMascot(pref);
  const mascotName = MASCOTS[mascot].name;
  const count = Math.max(1, batch.count);
  const sourceName = batch.source === 'tavern' ? 'Tavern' : batch.source === 'ravens-eye' ? "Raven's Eye" : 'Rookery';

  let title;
  let body;
  if (batch.source === 'tavern') {
    title = mascot === 'mara' ? 'The tavern carries on' : 'The tavern is abuzz!';
    body = count === 1
      ? (mascot === 'mara' ? 'Fresh words await you in the Tavern.' : 'Fresh words await you in the Tavern, my liege.')
      : (mascot === 'mara' ? `${count} fresh tidings await you in the Tavern.` : `${count} fresh tidings await you in the Tavern, my liege.`);
  } else if (batch.source === 'ravens-eye') {
    title = mascot === 'mara' ? 'Fresh murmurs from the Eye' : "The Eye has fresh tidings!";
    body = count === 1
      ? (mascot === 'mara' ? "Fresh activity waits beneath the Raven's Eye." : "Fresh activity awaits beneath the Raven's Eye, my liege.")
      : (mascot === 'mara' ? `${count} fresh tidings wait beneath the Raven's Eye.` : `${count} fresh tidings await beneath the Raven's Eye, my liege.`);
  } else {
    title = mascot === 'mara' ? 'Fresh tidings from the realm' : 'Fresh tidings await!';
    body = count === 1 ? `A fresh tiding awaits in ${sourceName}.` : `${count} fresh tidings await in ${sourceName}.`;
  }

  const notificationUrl = '/notifications?view=personal';
  let delivered = false;
  for (const sub of subscriptions) {
    try {
      const response = await sendPush(sub, {
        title,
        body: `${body} — ${mascotName}`,
        icon: MASCOTS[mascot].portrait,
        badge: '/icon.png',
        url: notificationUrl,
        tag: `asofab-page-${batch.source}`,
        renotify: true,
        badgeCount: unreadCount,
        data: { source: batch.source, mascot, groupedPagePush: true },
      });
      if (response?.status === 404 || response?.status === 410) await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      else if (response?.ok) delivered = true;
    } catch (error) { console.error('NPC community page push failed.', error); }
  }

  if (delivered) {
    const nextStreak = pref.last_mascot === mascot ? pref.mascot_streak + 1 : 1;
    const next = {
      ...pref,
      last_mascot: mascot,
      mascot_streak: nextStreak,
      mara_count: pref.mara_count + (mascot === 'mara' ? 1 : 0),
      aldren_count: pref.aldren_count + (mascot === 'aldren' ? 1 : 0),
    };
    prefMap.set(batch.recipient, next);
    await supabase.from('notification_preferences').upsert({
      user_id: batch.recipient,
      mascot_mode: 'balanced',
      preferences: next.preferences,
      last_mascot: mascot,
      mascot_streak: nextStreak,
      mara_count: next.mara_count,
      aldren_count: next.aldren_count,
      last_variants: next.last_variants,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  }

  return delivered;
}

const pendingPagePushes = new Map();
function queuePagePush(event, notificationId) {
  const [source] = KIND_META[event.kind];
  const key = `${event.recipient}:${source}`;
  const current = pendingPagePushes.get(key) ?? { recipient:event.recipient, source, count:0, notificationIds:new Set(), eventKeys:new Set() };
  current.count += 1;
  if (notificationId) current.notificationIds.add(notificationId);
  current.eventKeys.add(event.eventKey);
  pendingPagePushes.set(key, current);
}

async function dispatch(event) {
  if (!preferenceEnabled(event.recipient, event.kind)) return { skipped:true, reason:'preference' };
  const [source, preferenceKey] = KIND_META[event.kind];

  const { data: already } = await supabase.from('site_notifications').select('*').eq('user_id', event.recipient).contains('context', { eventKeys:[event.eventKey] }).limit(1).maybeSingle();
  if (already) {
    // If an earlier run recorded the event but could not deliver push, retry it
    // only through the source/page batch. Already delivered events stay quiet.
    if (already.context?.pushDelivered === false) queuePagePush(event, already.id);
    return { skipped:true, reason:'already-recorded' };
  }

  const pref = prefMap.get(event.recipient) ?? normalizePrefs(event.recipient, null);
  const eventTime = Date.parse(event.publishedAt);
  const low = new Date(eventTime - 45_000).toISOString(), high = new Date(eventTime + 45_000).toISOString();
  const { data: recent } = await supabase.from('site_notifications').select('*').eq('user_id', event.recipient).eq('source', source).contains('context',{ groupKey:event.groupKey }).gte('created_at',low).lte('created_at',high).order('created_at',{ascending:false}).limit(1).maybeSingle();

  if (recent) {
    const count = Math.max(1, Number(recent.context?.groupCount ?? 1)) + 1;
    const groupedBody = recent.mascot === 'mara' ? `${count} fresh tidings from the same place. Kept to one raven.` : `${count} fresh tidings from the same quarter have arrived together, my liege.`;
    const context = { ...(recent.context ?? {}), ...(event.context ?? {}), actorName:event.actorName, groupKey:event.groupKey, groupCount:count, eventKeys:[...(recent.context?.eventKeys ?? []), event.eventKey], pushDelivered:false };
    const { data: updated } = await supabase.from('site_notifications').update({ body:groupedBody, href:event.href, source_label:event.sourceLabel, context, read_at:null, created_at:event.publishedAt }).eq('id',recent.id).select('*').single();
    if (updated) queuePagePush(event, updated.id);
    return { grouped:true };
  }

  const mascot = chooseMascot(pref);
  const rendered = render(event.kind, mascot, pref, event.actorName, event.sourceLabel);
  const context = { ...(event.context ?? {}), actorName:event.actorName, groupKey:event.groupKey, groupCount:1, eventKeys:[event.eventKey], pushDelivered:false };
  const { data, error } = await supabase.from('site_notifications').insert({
    user_id:event.recipient, actor_id:null, kind:event.kind, source, mascot, title:rendered.title, body:rendered.body, href:event.href,
    source_label:event.sourceLabel, context, dedupe_key:event.eventKey, created_at:event.publishedAt,
  }).select('*').single();
  if (error) {
    if (error.code === '23505') return { skipped:true, reason:'dedupe' };
    console.error(`Community notification insert failed (${event.kind}):`, error.message);
    return { error:true };
  }
  const nextStreak = pref.last_mascot === mascot ? pref.mascot_streak + 1 : 1;
  const next = { ...pref, last_mascot:mascot, mascot_streak:nextStreak, mara_count:pref.mara_count+(mascot==='mara'?1:0), aldren_count:pref.aldren_count+(mascot==='aldren'?1:0), last_variants:{...pref.last_variants,[`${event.kind}:${mascot}`]:rendered.index} };
  prefMap.set(event.recipient,next);
  await supabase.from('notification_preferences').upsert({ user_id:event.recipient, mascot_mode:'balanced', preferences:next.preferences, last_mascot:mascot, mascot_streak:nextStreak, mara_count:next.mara_count, aldren_count:next.aldren_count, last_variants:next.last_variants, updated_at:new Date().toISOString() },{onConflict:'user_id'});
  queuePagePush(event, data.id);
  return { inserted:true };
}

let inserted=0, grouped=0, skipped=0, errors=0;
for (const event of events) {
  const result = await dispatch(event);
  if (result?.inserted) inserted++;
  else if (result?.grouped) grouped++;
  else if (result?.error) errors++;
  else skipped++;
}

let pagePushes = 0;
for (const batch of pendingPagePushes.values()) {
  const delivered = await deliverPagePush(batch);
  if (!delivered) continue;
  pagePushes++;
  for (const id of batch.notificationIds) {
    const { data: row } = await supabase.from('site_notifications').select('context').eq('id', id).maybeSingle();
    if (!row) continue;
    await supabase.from('site_notifications').update({ context:{ ...(row.context ?? {}), pushDelivered:true } }).eq('id', id);
  }
}

console.log(`Community notifications: ${events.length} candidate deliveries; ${inserted} new, ${grouped} grouped, ${skipped} skipped/deduped, ${errors} errors; ${pagePushes} page-level push(es). Lookback: ${lookbackHours}h.`);
if (errors) process.exitCode = 1;
