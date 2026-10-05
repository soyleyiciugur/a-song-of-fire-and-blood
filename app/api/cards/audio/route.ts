import { readdir } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  let tracks: string[] = [];
  try {
    const entries = await readdir(path.join(process.cwd(), "public", "images", "cards", "audio"), { withFileTypes: true });
    tracks = entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".mp3") && entry.name.toLowerCase() !== "ambience.mp3")
      .map((entry) => `/images/cards/audio/${encodeURIComponent(entry.name)}`)
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return Response.json({ tracks }, { headers: { "Cache-Control": "no-store" } });
}
