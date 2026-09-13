import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { shellRelease, needsReinstall } from "@/lib/pwa/release";
import { releaseNotification } from "@/lib/pwa/server";

export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(shellRelease, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({}, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ signedIn: false }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.installationId ?? "") || !["check", "acknowledge"].includes(body.action)) return Response.json({}, { status: 400 });
  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "The rookery is unavailable. Please try again." }, { status: 503 });
  const { data: previous, error } = await admin.from("app_shell_installations").select("acknowledged_version").eq("user_id", user.id).eq("installation_id", body.installationId).maybeSingle();
  if (error) return Response.json({ error: "Your seal could not be checked." }, { status: 503 });
  const supplied = Number.isInteger(body.installedVersion) && body.installedVersion >= 0 && body.installedVersion <= shellRelease.version ? body.installedVersion : 0;
  const version = body.action === "acknowledge" ? shellRelease.version : previous?.acknowledged_version ?? supplied;
  const { error: writeError } = await admin.from("app_shell_installations").upsert({ user_id: user.id, installation_id: body.installationId, acknowledged_version: version, updated_at: new Date().toISOString() });
  if (writeError) return Response.json({ error: "Your seal could not be saved." }, { status: 503 });
  const notification = needsReinstall(version) ? await releaseNotification(user.id) : null;
  return Response.json({ signedIn: true, version, mascot: notification?.mascot ?? null });
}
