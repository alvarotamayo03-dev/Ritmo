const CACHE_NAME = "ritmo-shell-v1";
const SHELL_FILES = ["./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith("ritmo-shell-") && key !== CACHE_NAME).map(key => caches.delete(key))
  )));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const indexUrl = new URL("./index.html", self.registration.scope).href;
  if (event.request.mode === "navigate" && (url.href === indexUrl || url.href === self.registration.scope)) {
    event.respondWith(fetch(event.request).then(async response => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(indexUrl, response.clone());
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(indexUrl);
      return cached || Response.error();
    }));
    return;
  }
  if (SHELL_FILES.some(path => new URL(path, self.registration.scope).href === url.href)) {
    event.respondWith(fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      return cached || Response.error();
    }));
  }
});
