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
  // Installation metadata must come from the current deploy, even when an old
  // worker is still controlling Safari during the guided re-add flow.
  if (["/manifest.webmanifest", "/icon.png", "/apple-icon.png"].includes(url.pathname)) {
    event.respondWith(fetch(event.request, { cache: "no-store" }).catch(async () => (await caches.match(event.request)) || Response.error()));
    return;
  }

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

  const title = payload.title || "A Song of Fire and Blood";
  const options = {
    body: payload.body || "A new raven has arrived.",
    icon: payload.icon || "/icon.png",
    badge: payload.badge || "/icon.png",
    tag: payload.tag || "asofab-notification",
    data: { url: payload.url || "/notifications", ...(payload.data || {}) },
    renotify: Boolean(payload.renotify),
  };

  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);
    if (Number.isFinite(payload.badgeCount) && "setAppBadge" in self.navigator) {
      try { await self.navigator.setAppBadge(payload.badgeCount); } catch {}
    }
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/notifications", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) {
        if ("navigate" in client) await client.navigate(target);
        return client.focus();
      }
    }
    return self.clients.openWindow(target);
  })());
});
