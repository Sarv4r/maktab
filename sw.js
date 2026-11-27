const CACHE = "maktabos-public-shell-v32";
const files = ["./", "./index.html", "./assets/css/styles.css", "./assets/css/experience.css",
  "./assets/app.js", "./assets/experience.js", "./assets/phone.js", "./assets/icon-48.png", "./assets/icon-192.png", "./assets/icon-512.png", "./manifest.webmanifest"];
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
  const path = event.request.mode === "navigate" ? "./index.html" : event.request;
  event.respondWith(caches.open(CACHE).then(async cache => await cache.match(path) || fetch(event.request)));
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
