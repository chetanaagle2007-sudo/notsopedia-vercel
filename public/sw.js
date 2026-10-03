const CACHE_NAME = "notsopedia-v1";

const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/pwa-icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  // Never cache API/backend requests.
  if (url.pathname.startsWith("/api/")) return;

  // Static PWA shell: network first, cached fallback.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
