const localDay = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'});
const longDay = new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/Istanbul',day:'numeric',month:'long',year:'numeric'});

// Calendar sections use Istanbul midnight; recent sections subdivide today by elapsed hours.
export function notificationTimeGroup(publishedAt, now) {
  const time = Date.parse(publishedAt);
  const day = localDay.format(time);
  if (day === localDay.format(now)) {
    const minutes = Math.max(0, (now-time)/60000);
    if (minutes < 5) return 'Now';
    if (minutes < 60) return 'Earlier this hour';
    const hours = Math.floor(minutes/60);
    if (hours < 12) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    return 'Today';
  }
  if (day === localDay.format(now-86400000)) return 'Yesterday';
  return longDay.format(time);
}

export function groupNotifications(items, now) {
  const groups = new Map();
  for (const item of items) {
    const label = notificationTimeGroup(item.publishedAt, now);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(item);
  }
  return [...groups].map(([label, entries]) => ({label, entries}));
}
