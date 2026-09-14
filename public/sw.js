const ASOFAB_NOTIFICATION_ROOT = "/notifications";

function safeTarget(data = {}) {
  try {
    if (data.notificationId) {
      return new URL(`${ASOFAB_NOTIFICATION_ROOT}?open=${encodeURIComponent(String(data.notificationId))}`, self.location.origin).href;
    }
    const requested = new URL(typeof data.url === "string" ? data.url : ASOFAB_NOTIFICATION_ROOT, self.location.origin);
    if (requested.origin !== self.location.origin) return new URL(ASOFAB_NOTIFICATION_ROOT, self.location.origin).href;
    return requested.href;
  } catch {
    return new URL(ASOFAB_NOTIFICATION_ROOT, self.location.origin).href;
  }
}

function parsePush(event) {
  try { return event.data?.json?.() ?? {}; }
  catch {
    try { return JSON.parse(event.data?.text?.() ?? "{}"); }
    catch { return {}; }
  }
}

async function deliverToVisibleApp(payload) {
  if (!self.clients?.matchAll) return false;
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const visible = windows.filter((client) => {
    try { return new URL(client.url).origin === self.location.origin && client.visibilityState === "visible"; }
    catch { return false; }
  });

  for (const client of visible) {
    const handled = await new Promise((resolve) => {
      const channel = new MessageChannel();
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { channel.port1.close(); } catch {}
        resolve(Boolean(value));
      };
      const timer = setTimeout(() => finish(false), 650);
      channel.port1.onmessage = (message) => finish(message.data?.handled === true || message.data === "handled");
      try { client.postMessage({ type: "ASOFAB_PUSH_NOTIFICATION", notification: payload }, [channel.port2]); }
      catch { finish(false); }
    });
    if (handled) return true;
  }
  return false;
}

self.addEventListener("install", (event) => {
  if (self.skipWaiting) event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", (event) => {
  if (self.clients?.claim) event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    const payload = parsePush(event);
    if (await deliverToVisibleApp(payload)) return;
    if (!self.registration?.showNotification) return;
    const data = { ...(payload.data ?? {}), url: payload.url ?? payload.data?.url ?? ASOFAB_NOTIFICATION_ROOT };
    await self.registration.showNotification(payload.title || "A raven has arrived", {
      body: payload.body || "Word has reached the rookery.",
      icon: payload.icon || "/icon.png",
      badge: payload.badge || "/icon.png",
      tag: payload.tag || (data.notificationId ? `asofab-${data.notificationId}` : "asofab-raven"),
      renotify: Boolean(payload.renotify),
      data,
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const target = safeTarget(event.notification.data ?? {});
    const windows = self.clients?.matchAll
      ? await self.clients.matchAll({ type: "window", includeUncontrolled: true })
      : [];

    for (const client of windows.filter((candidate) => {
      try { return new URL(candidate.url).origin === self.location.origin; }
      catch { return false; }
    })) {
      try {
        if ("focus" in client) await client.focus();
        const handled = await new Promise((resolve) => {
          const channel = new MessageChannel();
          let settled = false;
          const finish = (value) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            try { channel.port1.close(); } catch {}
            resolve(value);
          };
          const timer = setTimeout(() => finish(false), 1200);
          channel.port1.onmessage = (message) => finish(message.data === "navigated");
          try { client.postMessage({ type: "ASOFAB_OPEN_NOTIFICATION", url: target }, [channel.port2]); }
          catch { finish(false); }
        });
        if (handled) return;
        if ("navigate" in client) {
          const navigated = await client.navigate(target);
          if (navigated) return;
        }
      } catch {
        // Stale/closed clients should not block another client or a cold start.
      }
    }

    if (self.clients?.openWindow) await self.clients.openWindow(target);
  })());
});
