const CACHE_NAME = "tinker-shell-20260818-1";
const SHELL = ["./", "./manifest.webmanifest", "./logo.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL).catch(() => {}))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;

  if (req.method !== "GET") return;

  const url = new URL(req.url);

  if (
    req.mode === "navigate" ||
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html")
  ) {
    event.respondWith(
      fetch(req, { cache: "no-store" })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return response;
        })
        .catch(() =>
          caches.match(req).then(cached => cached || caches.match("./"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return response;
      });
    })
  );
});
