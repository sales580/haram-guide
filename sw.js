/* Umrah Companion offline copy. Bump VERSION after every change to the files below, or phones keep the old copy. */
var VERSION = 'uc-v7';
var FILES = ["./", "style.css", "content.js", "media.js", "maps.js", "base.js", "inside.js", "lessons.js", "scene.js", "map3d.js", "manifest.json", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "adhan.umd.min.js", "app.js", "index.html"];
/* Fetched from other sites the first time they are needed, then kept: the 3D library and the fonts. */
var KEEP = /^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  /* The lesson schedule changes every few days: take the newest when online, the saved one when not. */
  if (/\/lessons\.json/.test(e.request.url)) {
    e.respondWith(fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(VERSION).then(function (c) { c.put('lessons.json', copy); });
      return res;
    }).catch(function () { return caches.match('lessons.json'); }));
    return;
  }
  if (KEEP.test(e.request.url)) {
    e.respondWith(caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(e.request, copy); });
        return res;
      });
    }));
    return;
  }
  /* Photographs and portraits: kept the first time they are seen, so they still show without a connection. */
  if (/\/[tp]-[^\/]+\.jpg/.test(e.request.url)) {
    e.respondWith(caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(e.request, copy); });
        return res;
      });
    }));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) { return hit || fetch(e.request); }));
});
