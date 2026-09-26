import { readdir } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  let images: string[] = [];
  let front: string | null = null;

  try {
    const entries = await readdir(path.join(process.cwd(), "public", "images", "decks"), {
      withFileTypes: true,
    });
    images = entries
      .filter((entry) => entry.isFile() && /^deckback-[^/\\]+\.(?:webp|png|jpe?g|avif)$/i.test(entry.name))
      .map((entry) => `/images/decks/${encodeURIComponent(entry.name)}`)
      .sort();
    const frontFile = entries
      .filter((entry) => entry.isFile() && /^deckfront-[^/\\]+\.(?:webp|png|jpe?g|avif)$/i.test(entry.name))
      .map((entry) => entry.name)
      .sort()[0];
    if (frontFile) front = `/images/decks/${encodeURIComponent(frontFile)}`;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  return Response.json({ images, front }, { headers: { "Cache-Control": "no-store" } });
}
