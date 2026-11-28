const CACHE_NAME = "shalom-tabernacle-v6";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json",
  "./logo.png",
  "./app-icon-192.png",
  "./app-icon-512.png"
];

const EXCLUDED_PATHS = [
  "/admin",
  "/admin.html",
  "/admin.js"
];

function isExcludedPath(pathname) {
  return EXCLUDED_PATHS.some(
    (excluded) =>
      pathname === excluded ||
      pathname.startsWith(`${excluded}/`) ||
      pathname.endsWith(excluded)
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
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

  // Never cache external APIs (e.g., Google Apps Script) or private admin pages.
  if (url.origin !== self.location.origin) return;
  if (isExcludedPath(url.pathname)) return;

  // Network-first for HTML/JS/manifest so updates arrive quickly while remaining offline-ready.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copy);
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request, { ignoreSearch: true });
        if (cached) return cached;

        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
        return Response.error();
      })
  );
});
