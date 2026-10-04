import { readdir } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  let files: string[] = [];
  try {
    files = (await readdir(path.join(process.cwd(), "public/images/cards/profile-frame"), { withFileTypes: true }))
      .filter(entry => entry.isFile() && /^(?:profile|house)-frame-[^/\\]+\.(?:webp|png|avif)$/i.test(entry.name))
      .map(entry => entry.name).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const urls = (prefix: string) => files.filter(file => file.toLowerCase().startsWith(prefix)).map(file => `/images/cards/profile-frame/${encodeURIComponent(file)}`);
  return Response.json({ profiles: urls("profile-frame-"), houses: urls("house-frame-") }, { headers: { "Cache-Control": "no-store" } });
}
