// Minimal service worker: exists mainly to satisfy PWA installability
// criteria (Chrome/Android require a registered SW with a fetch handler
// before it will offer "Add to Home Screen"). Deliberately network-first
// and does not cache API responses or authenticated pages — this app's
// data (expedientes, sessions) needs to stay live, not served stale from
// a cache. Only the static app shell (icons, manifest) gets a light cache
// as a fallback for flaky connections.
const CACHE_NAME = "avla-nexus-shell-v1";
const SHELL_ASSETS = ["/icons/icon-192.png", "/icons/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (!SHELL_ASSETS.includes(url.pathname)) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
