import { createAdminClient } from "@/lib/supabase/admin";
import { releaseNotification } from "@/lib/pwa/server";
import { shellRelease } from "@/lib/pwa/release";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({}, { status: 401 });
  if (!shellRelease.reinstallRequired) return Response.json({ delivered: 0 });
  const admin = createAdminClient();
  if (!admin) return Response.json({}, { status: 503 });
  // Small, retryable batches; the unique notification key also protects concurrent runs.
  const { data, error } = await admin.rpc("pending_shell_recipients", { required_version: shellRelease.version });
  if (error) return Response.json({ error: "Release recipients unavailable." }, { status: 503 });
  let delivered = 0;
  for (const row of data ?? []) if (await releaseNotification(row.user_id)) delivered++;
  return Response.json({ delivered });
}
