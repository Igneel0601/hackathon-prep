// Cafe POS service worker — caches the app shell so the POS loads + installs
// offline. Data is NOT cached here (Legend-State + IndexedDB own offline data);
// /api requests pass straight through. Plain JS, no build step.
const CACHE = "cafe-pos-shell-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // skip cross-origin (Unsplash, fonts)
  if (url.pathname.startsWith("/api/")) return; // data is Legend-State's job, not the SW
  if (url.pathname === "/sw.js") return;

  // Page navigations: network-first, fall back to the cached page (or "/") offline.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(CACHE);
          return (await cache.match(request)) || (await cache.match("/")) || Response.error();
        }
      })(),
    );
    return;
  }

  // Static assets (_next/static chunks, icons, css): stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((res) => {
          if (res && res.ok) cache.put(request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })(),
  );
});
