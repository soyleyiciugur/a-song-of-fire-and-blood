import { NextResponse } from "next/server";
import { isLuckAdmin } from "@/lib/adminAccess";
import { updateMultipleFilesOnGithub } from "@/lib/github";
import { ArtworkMapSchema } from "@/lib/the-great-game/artwork";

export async function POST(request: Request) {
  if (!(await isLuckAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = ArtworkMapSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid card framing settings" }, { status: 400 });
  try {
    await updateMultipleFilesOnGithub([{ path: "data/the-great-game/artwork.json", content: parsed.data }], "Update Great Game card framing");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not publish card framing. Your draft is preserved." }, { status: 500 });
  }
}
