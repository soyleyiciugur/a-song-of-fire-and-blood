import { readdir } from "node:fs/promises";
import path from "node:path";


export async function GET() {
  // Preserve the client's base/extension priority without probing missing URLs.
  const folders = ["cards", "characters", "dragons"];
  const groups = await Promise.all(folders.map(async folder => {
    try {
      const entries = await readdir(path.join(process.cwd(), "public/images", folder), { withFileTypes: true });
      return entries.filter(entry => entry.isFile() && /\.(webp|png|jpg|jpeg)$/.test(entry.name))
        .map(entry => `/images/${folder}/${entry.name}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      return [];
    }
  }));
  return Response.json(groups.flat(), { headers: { "Cache-Control": "no-store" } });
}
