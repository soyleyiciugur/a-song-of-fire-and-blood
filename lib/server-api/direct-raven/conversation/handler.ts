import { NextResponse } from "next/server";
import { loadDirectRavenConversationOnly } from "@/lib/directRaven";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid Raven path." }, { status: 400 });
  try {
    const data = await loadDirectRavenConversationOnly(id);
    if (!data) return NextResponse.json({ error: "Sign in to send a raven." }, { status: 401 });
    if (!data.selected) return NextResponse.json({ error: "This Raven path is closed." }, { status: 404 });
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "The ravens could not be loaded." }, { status: 503 }); }
}
