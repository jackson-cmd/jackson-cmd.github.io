---
layout: none
permalink: /sw.js
sitemap: false
---
// PWA retired: this SW unregisters itself, wipes caches, and reloads any open clients.
self.addEventListener("install", () => { self.skipWaiting(); });

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map((n) => caches.delete(n)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: "window" });
    clients.forEach((c) => c.navigate(c.url));
  })());
});

self.addEventListener("fetch", () => { /* passthrough — do not intercept */ });
