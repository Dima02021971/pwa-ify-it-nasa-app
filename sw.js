
const SHELL_CACHE = "nasa-shell-v2";
const API_CACHE = "nasa-api-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./js/script.js",
  "./js/dateRange.js",
  "./manifest.json",
  "./img/nasa-worm-logo.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Install: cache essential application files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate: remove outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter(
            (key) =>
              key !== SHELL_CACHE &&
              key !== API_CACHE
          )
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })
  );
});

// Intercept network requests
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // NASA APOD API: network-first
  if (
  
url.origin === "https://science.nasa.gov" &&
url.pathname.startsWith("/wp-json/wp/v2/apod-basic")

  ) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const response = await fetch(request);

          if (response.ok) {
            await cache.put(
              request,
              response.clone()
            );
          }

          return response;
        } catch (error) {
          const cached = await cache.match(request);
          if (cached) return cached;
          throw error;
        }
      })
    );
    return;
  }

  // App shell: cache-first
  if (
    url.origin === self.location.origin &&
    url.pathname.startsWith(
      new URL("./", self.registration.scope).pathname
    )
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            if (!response.ok) return response;

            const copy = response.clone();

            caches.open(SHELL_CACHE).then(
              (cache) => cache.put(request, copy)
            );

            return response;
          })
        );
      })
    );
  }
});
