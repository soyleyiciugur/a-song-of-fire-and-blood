import { NextRequest } from "next/server";
import * as handler0 from "@/lib/server-api/admin/card-artwork/handler";
import * as handler1 from "@/lib/server-api/admin/content-sync/commit/handler";
import * as handler2 from "@/lib/server-api/admin/content-sync/handler";
import * as handler3 from "@/lib/server-api/admin/house-of-the-dragon/handler";
import * as handler4 from "@/lib/server-api/admin/notifications/handler";
import * as handler5 from "@/lib/server-api/admin/publish/handler";
import * as handler6 from "@/lib/server-api/app-shell/handler";
import * as handler7 from "@/lib/server-api/cards/artwork/handler";
import * as handler8 from "@/lib/server-api/cards/audio/handler";
import * as handler9 from "@/lib/server-api/cards/deck-backs/handler";
import * as handler10 from "@/lib/server-api/cards/profile-frames/handler";
import * as handler11 from "@/lib/server-api/community/content/handler";
import * as handler12 from "@/lib/server-api/community/friends/handler";
import * as handler13 from "@/lib/server-api/community/guestbook/handler";
import * as handler14 from "@/lib/server-api/community/handler";
import * as handler15 from "@/lib/server-api/direct-raven/conversation/handler";
import * as handler16 from "@/lib/server-api/direct-raven/share-comment/handler";
import * as handler17 from "@/lib/server-api/direct-raven/share-page/handler";
import * as handler18 from "@/lib/server-api/direct-raven/share-reel/handler";
import * as handler19 from "@/lib/server-api/giphy/search/handler";
import * as handler20 from "@/lib/server-api/great-game/chat/handler";
import * as innerCourtSurvey from "@/lib/server-api/inner-court/survey/handler";
import * as handler21 from "@/lib/server-api/great-game/collection/handler";
import * as handler22 from "@/lib/server-api/great-game/deck-stats/handler";
import * as handler23 from "@/lib/server-api/great-game/hub/handler";
import * as handler24 from "@/lib/server-api/great-game/invite/handler";
import * as handler25 from "@/lib/server-api/great-game/rank-history/handler";
import * as handler26 from "@/lib/server-api/great-game/handler";
import * as handler27 from "@/lib/server-api/great-game/seasons/handler";
import * as handler28 from "@/lib/server-api/great-game/social/handler";
import * as handler29 from "@/lib/server-api/great-game/spectate/handler";
import * as handler30 from "@/lib/server-api/notifications/broadcast/handler";
import * as handler31 from "@/lib/server-api/notifications/direct-raven/handler";
import * as handler32 from "@/lib/server-api/notifications/reaction/handler";
import * as handler33 from "@/lib/server-api/push/test/handler";
import * as handler34 from "@/lib/server-api/search/handler";
import * as handler35 from "@/lib/server-api/workbench/threads/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Handler = (request: NextRequest) => Response | Promise<Response>;
const handlers: Record<string, Partial<Record<string, Handler>>> = {
  "admin/card-artwork": handler0,
  "admin/content-sync/commit": handler1,
  "admin/content-sync": handler2,
  "admin/house-of-the-dragon": handler3,
  "admin/notifications": handler4,
  "admin/publish": handler5,
  "app-shell": handler6,
  "cards/artwork": handler7,
  "cards/audio": handler8,
  "cards/deck-backs": handler9,
  "cards/profile-frames": handler10,
  "community/content": handler11,
  "community/friends": handler12,
  "community/guestbook": handler13,
  "community": handler14,
  "direct-raven/conversation": handler15,
  "direct-raven/share-comment": handler16,
  "direct-raven/share-page": handler17,
  "direct-raven/share-reel": handler18,
  "giphy/search": handler19,
  "great-game/chat": handler20,
  "inner-court/survey": innerCourtSurvey,
  "great-game/collection": handler21,
  "great-game/deck-stats": handler22,
  "great-game/hub": handler23,
  "great-game/invite": handler24,
  "great-game/rank-history": handler25,
  "great-game": handler26,
  "great-game/seasons": handler27,
  "great-game/social": handler28,
  "great-game/spectate": handler29,
  "notifications/broadcast": handler30,
  "notifications/direct-raven": handler31,
  "notifications/reaction": handler32,
  "push/test": handler33,
  "search": handler34,
  "workbench/threads": handler35,
};

async function dispatch(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const key = path.join("/");
  if (!Object.hasOwn(handlers, key)) return new Response(null, { status: 404 });
  const route = handlers[key];
  const allow = Object.keys(route).filter(method => /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(method));
  if (route.GET && !route.HEAD) allow.push("HEAD");
  if (!route.OPTIONS) allow.push("OPTIONS");
  const method = request.method;
  if (method === "OPTIONS" && !route.OPTIONS) return new Response(null, { status: 204, headers: { Allow: allow.sort().join(", ") } });
  const handler = route[method] ?? (method === "HEAD" ? route.GET : undefined);
  if (!handler) return new Response(null, { status: 405, headers: { Allow: allow.sort().join(", ") } });
  const response = await handler(request);
  return method === "HEAD" ? new Response(null, { status: response.status, statusText: response.statusText, headers: response.headers }) : response;
}

export { dispatch as GET, dispatch as POST, dispatch as PUT, dispatch as PATCH, dispatch as DELETE, dispatch as HEAD, dispatch as OPTIONS };
