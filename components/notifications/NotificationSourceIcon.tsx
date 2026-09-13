import RavenIcon from "@/components/direct-raven/RavenIcon";
import UtilityIcon from "@/components/nav/UtilityIcon";
import type { NotificationSource } from "@/lib/notifications/types";

export default function NotificationSourceIcon({ source, size = 16 }: { source: NotificationSource; size?: number }) {
  if (source === "tavern") return <UtilityIcon name="taverns" size={size} />;
  if (source === "ravens-eye") return <UtilityIcon name="eye" size={size} />;
  if (source === "direct-raven" || source === "guild-parley") return <RavenIcon size={size} />;
  if (source === "guestbook") return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4.5h14v15H5z" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="1.5"/><path d="M8 8h8M8 12h5M8 16h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
  if (source === "chronicle") return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5.5c2.8-.9 5.2-.6 8 1.2v12c-2.8-1.8-5.2-2.1-8-1.2v-12Zm16 0c-2.8-.9-5.2-.6-8 1.2v12c2.8-1.8 5.2-2.1 8-1.2v-12Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M12 7v12" stroke="currentColor" strokeWidth="1.5" /></svg>;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 2 2.25 7.75L22 12l-7.75 2.25L12 22l-2.25-7.75L2 12l7.75-2.25L12 2Z" fill="currentColor" fillOpacity=".16" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" /></svg>;
}
