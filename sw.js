const CACHE = "maktabos-public-shell-v19";
const files = ["./", "./index.html", "./assets/auth-ui.js", "./assets/firebase-auth.js", "./assets/icon-48.png", "./assets/icon-192.png", "./assets/icon-512.png", "./manifest.webmanifest"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache =>
    cache.addAll(files.map(path => new Request(path, {cache:"reload"})))));
});
self.addEventListener("message", event => {
  if (event.data === "activate-update") event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("maktabos-public-shell-") && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.registration.scope)) return;
  const url = new URL(event.request.url);
  const shell = files.some(path => new URL(path, self.registration.scope).pathname === url.pathname);
  if (!shell && event.request.mode !== "navigate") return;
  const path = event.request.mode === "navigate" ? "./index.html" : url.href;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(path, {ignoreSearch:true});
    if (cached) return cached;
    try { return await fetch(event.request); }
    catch { return new Response("Internet aloqasi mavjud emas.", {status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}}); }
  }));
});
self.addEventListener("push", event => {
  event.waitUntil(self.registration.showNotification("IlmNuri", {
    body:"Yangi maktab e’loni bor.", tag:"maktabos-announcement", icon:"./assets/icon-192.png"
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await clients.matchAll({type:"window", includeUncontrolled:true});
    const tab = windows.find(w => w.url.startsWith(self.registration.scope));
    if (tab) { await tab.focus(); tab.postMessage("open-announcements"); }
    else await clients.openWindow(new URL("./?view=announcements", self.registration.scope).href);
  })());
});
