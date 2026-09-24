import Link from "next/link";

const TABS = [
  { id: "timeline", label: "Timeline", href: "/timeline" },
  { id: "annals", label: "Annals", href: "/chronicle/annals" },
  { id: "calendar", label: "Calendar", href: "/calendar" },
  { id: "bloodshed", label: "Bloodshed", href: "/wars" },
] as const;

type ChronicleTab = (typeof TABS)[number]["id"];

export default function ChronicleTabs({ active, className, activeClassName }: { active: ChronicleTab; className?: string; activeClassName?: string }) {
  return <nav className={[className, "realm-section-tabs"].filter(Boolean).join(" ")} aria-label="Chronicle sections">
    {TABS.map((tab) => <Link key={tab.id} href={tab.href} aria-current={active === tab.id ? "page" : undefined} className={active === tab.id ? activeClassName : undefined}>{tab.label}</Link>)}
  </nav>;
}
