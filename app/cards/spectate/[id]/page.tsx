import SpectatorTable from "@/components/the-great-game/SpectatorTable";
export default async function SpectatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SpectatorTable matchId={id} />;
}
