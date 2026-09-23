import RavenIcon from "@/components/direct-raven/RavenIcon";

export type UtilityIconName = "search" | "dragon" | "quote" | "shared" | "info" | "block" | "workbench" | "eye" | "cards" | "taverns" | "raven" | "notifications";

export default function UtilityIcon({ name, size = 20, className }: { name: UtilityIconName; size?: number; className?: string }) {
  if (name === "raven") return <RavenIcon size={size} />;
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    {name === "dragon" && <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21c-2-4-1-8 2-11L5 5l5 2 4-4v5l3 2 4 1-1 4h-5l-2 3v3" /><path d="m7 10 3 1M15 15l-3-1M5 21h8" /><circle cx="15.5" cy="10.5" r=".75" fill="currentColor" stroke="none" /></g>}
    {name === "quote" && <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 6H7a4 4 0 0 0-4 4v7h7v-7H6c0-1.1.9-2 2-2h2ZM21 6h-3a4 4 0 0 0-4 4v7h7v-7h-4c0-1.1.9-2 2-2h2Z" fill="currentColor" fillOpacity=".12" /></g>}
    {name === "shared" && <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="7" width="14" height="14" rx="2" /><path d="M17 4V3H3v14h1m4 1 4-4 3 3 2-2 4 4" /><circle cx="16.5" cy="11.5" r="1" /></g>}
    {name === "info" && <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><circle cx="12" cy="7" r=".75" fill="currentColor" stroke="none" /></g>}
    {name === "block" && <g stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></g>}
    {name === "search" && <><circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" /><path d="m14.24 14.24 5.76 5.76" stroke="currentColor" strokeWidth="1.5" /></>}
    {name === "workbench" && <g transform="rotate(45 12 12)" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 3 8 6.5c0 2 1.1 3.3 2.5 4v7.2l-.8 1.8L12 22l2.3-2.5-.8-1.8v-7.2c1.4-.7 2.5-2 2.5-4L15.5 3 14 6.5l-2 1-2-1Z" fill="currentColor" fillOpacity=".08" /><path d="M10.5 16.5h3" /></g>}
    {name === "eye" && <><path d="M2.5 12.5 6 9.2C8.1 7.3 10.3 6.7 12.5 7c3.7.4 6.5 2.6 9 5.1-2.9 1.3-5 4.8-9.1 4.9-4 .1-7.4-2.1-9.9-4.5Z" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><circle cx="12.1" cy="11.9" r="3.25" fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeWidth="1.5" /><circle cx="12.1" cy="11.9" r="1.25" fill="currentColor" /></>}
    {name === "cards" && <><rect x="5.5" y="3.5" width="13" height="17" rx="1.8" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="1.5" transform="rotate(8 12 12)" /><rect x="4.5" y="4.5" width="13" height="17" rx="1.8" fill="var(--surface)" stroke="currentColor" strokeWidth="1.5" transform="rotate(-8 12 12)" /><path d="M22 10.5 26.2 18 33.5 22l-7.3 4L22 33.5 17.8 26 10.5 22l7.3-4Z" fill="currentColor" transform="rotate(-8 12 12) translate(11 13) scale(.4) translate(-22 -22)" /></>}
    {name === "taverns" && <><path d="M5 8h12v12H5Z" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M17 9h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M5 8a2 2 0 0 1 0-4 2.5 2.5 0 0 1 4-1 3 3 0 0 1 5 1 2 2 0 1 1 3 4M9 11v6m4-6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>}
    {name === "notifications" && <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>;
}
