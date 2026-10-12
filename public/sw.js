// Notsopedia PWA Service Worker — v2
// Bump this version string on every production deployment to ensure
// already-installed PWAs detect and apply the update.
const CACHE_VERSION = "v2";
const CACHE_NAME = `notsopedia-${CACHE_VERSION}`;

const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/pwa-icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  // Do NOT call skipWaiting() unconditionally here.
  // We let the update prompt in main.tsx call skipWaiting() via postMessage
  // so the user can confirm before the page reloads.
  // Exception: if this is the very first install (no previous controller),
  // activate immediately so the PWA works right away.
  if (!self.registration.active) {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Allow the app to trigger activation of a waiting service worker.
// main.tsx sends { type: "SKIP_WAITING" } when the user confirms the update.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
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
