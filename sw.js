// X Tracker service worker. Network-first for everything (HTML, JS, JSON) so updates arrive immediately;
// the cache is only an offline fallback. Old caches are deleted and a new SW takes over at once.
const C = "xt-v14";
const SHELL = ["./", "index.html", "approve/", "approve/index.html", "manifest.webmanifest", "icons/icon-192.png"];
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: "reload" })).catch(() => {})))));
});
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== C) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;  // never touch GitHub/X/CDN requests
  e.respondWith((async () => {
    try {
      const r = req.mode === "navigate"
        ? await fetch(req.url, { cache: "no-store", credentials: "same-origin" })
        : await fetch(req, { cache: "no-store" });
      if (r.ok && !new URL(req.url).pathname.includes("/approve/media/")) { const cp = r.clone(); caches.open(C).then(c => c.put(req, cp)); }
      return r;
    } catch (err) {
      return (await caches.match(req, { ignoreSearch: true })) || Response.error();
    }
  })());
});
