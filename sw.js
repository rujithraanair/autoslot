const CACHE_NAME = "autoslot-shell-v3";
const SHELL_ASSETS = ["/indexCopy.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Never intercept Firestore cloud or local emulator traffic
  if (
    url.includes("firestore.googleapis.com") ||
    url.includes(":8080") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  // Network-first for HTML pages so VS Code edits apply immediately
  if (event.request.mode === "navigate" || url.endsWith(".html")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets (manifest, icons)
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});