import Link from "next/link";

export const beastTypes = [
  { id: "dragons", name: "Dragons", description: "Living fire, ancient bonds, and the wings that shadow the realm." },
  { id: "direwolves", name: "Direwolves", description: "The great wolves of the North and the old forests." },
  { id: "dogs", name: "Dogs", description: "Hounds, companions, and faithful guardians." },
  { id: "cats", name: "Cats", description: "Quiet hunters in the halls and alleys of the realm." },
] as const;

export default function BestiaryTabs({ active }: { active: string }) {
  return <nav className="realm-section-tabs" aria-label="Bestiary sections"><Link href="/bestiary">The Bestiary</Link>{beastTypes.map((beast) => <Link key={beast.id} href={`/bestiary/${beast.id}`} aria-current={active === beast.id ? "page" : undefined}>{beast.name}</Link>)}</nav>;
}
