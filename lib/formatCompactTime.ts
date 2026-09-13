export function formatCompactTime(value: string | number | Date, now = Date.now()) {
  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp)) return "";

  const diffSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (diffSeconds < 60) return `${Math.max(1, diffSeconds)}s`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 2) return `${diffDays}d`;

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const currentYear = new Date(now).getFullYear();
  return year === currentYear ? `${day}/${month}` : `${day}/${month}/${year}`;
}
