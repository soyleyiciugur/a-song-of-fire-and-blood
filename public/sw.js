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
  const data = event.notification.data || {};
  const targetUrl = new URL("/notifications", self.location.origin);
  // Prefer the recorded notification identity over a generic/legacy URL.
  if (typeof data.notificationId === "string") targetUrl.searchParams.set("open", data.notificationId);
  else {
    try {
      const supplied = new URL(data.url || "/notifications", self.location.origin);
      if (supplied.origin === self.location.origin && supplied.pathname === "/notifications") targetUrl.search = supplied.search;
    } catch { /* Malformed legacy payload: open the ledger. */ }
  }
  const target = targetUrl.href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows.filter(client => new URL(client.url).origin === self.location.origin)) {
      try {
        // Wake the existing app first. Its router handles the deep link without
        // relying solely on WindowClient.navigate on a suspended iOS window.
        await client.focus();
        const handled = await new Promise(resolve => {
          const channel = new MessageChannel();
          const finish = value => { clearTimeout(timer); channel.port1.close(); resolve(value); };
          const timer = setTimeout(() => finish(false), 1200);
          channel.port1.onmessage = message => finish(message.data === "navigated");
          try { client.postMessage({ type: "ASOFAB_OPEN_NOTIFICATION", url: target }, [channel.port2]); }
          catch { finish(false); }
        });
        if (handled) return;
        const navigated = await client.navigate(target);
        if (navigated) return;
      } catch {
        // A stale/closed client must not prevent another client or a new window.
      }
    }
    return self.clients.openWindow(target);
  })());
});
