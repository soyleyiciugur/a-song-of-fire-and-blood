const CACHE_NAME = "asofab-shell-v1";
const APP_SHELL = ["/", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/") || url.pathname === "/sw.js") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => (await caches.match(event.request)) || (await caches.match("/offline")) || Response.error()),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => undefined);
          }
          return response;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    }),
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data?.json() ?? {}; } catch { payload = { body: event.data?.text() ?? "" }; }

  const title = payload.title || "The Rookery";
  const options = {
    body: payload.body || "A new raven has arrived.",
    icon: payload.icon || "/icon.png",
    badge: payload.badge || "/notification-badge.svg",
    tag: payload.tag || "asofab-notification",
    data: {
      url: payload.url || "/notifications",
      notificationId: payload.notificationId || payload.data?.notificationId || null,
      ...(payload.data || {}),
    },
    renotify: Boolean(payload.renotify),
  };

  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);
    if (Number.isFinite(payload.badgeCount) && "setAppBadge" in self.navigator) {
      try { await self.navigator.setAppBadge(payload.badgeCount); } catch {}
    }
  })());
});

function rookeryTarget(data = {}) {
  if (data.notificationId) {
    return new URL(`/notifications?open=${encodeURIComponent(data.notificationId)}`, self.location.origin).href;
  }

  try {
    const candidate = new URL(data.url || "/notifications", self.location.origin);
    if (candidate.origin === self.location.origin && candidate.pathname === "/notifications") return candidate.href;
  } catch {}

  return new URL("/notifications", self.location.origin).href;
}

async function askClientToOpen(client, target) {
  if (!("postMessage" in client)) return false;
  try {
    const channel = new MessageChannel();
    const acknowledged = new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), 800);
      channel.port1.onmessage = () => {
        clearTimeout(timer);
        try { channel.port1.close(); } catch {}
        resolve(true);
      };
    });
    client.postMessage({ type: "ASOFAB_OPEN_NOTIFICATION", url: target }, [channel.port2]);
    return await acknowledged;
  } catch {
    return false;
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = rookeryTarget(event.notification.data || {});

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

    for (const client of windows) {
      try {
        if (!("focus" in client)) continue;
        await client.focus();

        if (await askClientToOpen(client, target)) return;

        // Legacy/fallback path for clients that do not have the current PwaBoot listener yet.
        if ("navigate" in client) {
          await client.navigate(target);
          return;
        }
      } catch {
        // The client may have disappeared between matchAll() and focus(). Try the next one.
      }
    }

    await self.clients.openWindow(target);
  })());
});
