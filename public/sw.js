/**
 * Tiny offline shell. Deliberately conservative: it never caches Spotify,
 * never caches HTML documents beyond a single fallback, and gets out of the
 * way the moment the network is available.
 */
const CACHE = "diljale-v2";
const SHELL = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // never touch YouTube, its CDN, or anything cross-origin that streams
  if (url.origin !== self.location.origin) return;

  // API routes are live data — the cache-first branch below would freeze the
  // first response forever (a visitor in Mumbai kept being told they were in
  // Ludhiana, and the listener count would stick). Always go to the network.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    // network-first so a fresh deploy is picked up immediately
    event.respondWith(
      fetch(request).catch(() => caches.match("/").then((r) => r ?? Response.error())),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
