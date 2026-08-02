/* ============================================
   フレカ Service Worker
   - assets（css/js）とR2/Cloudinary画像をキャッシュ
   - GAS API は stale-while-revalidate（キャッシュを即返して裏で更新）
============================================ */
var CACHE_NAME = "freca-cache-v4";
var ASSET_PATHS = [
  "/assets/style.css",
  "/assets/view.js",
  "/assets/edit.js",
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSET_PATHS).catch(function () {});
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var url = e.request.url;

  // GAS API：キャッシュしない（常に最新を取得する）
  // ※ localStorage側でキャッシュしているため初期表示は速いまま
  if (url.indexOf("script.google.com") !== -1) return;

  // 画像（R2 / Cloudinary）：cache-first
  if (url.indexOf("res.cloudinary.com") !== -1 || url.indexOf(".r2.dev") !== -1) {
    e.respondWith(
      caches.open(CACHE_NAME).then(function (cache) {
        return cache.match(e.request).then(function (cached) {
          if (cached) return cached;
          return fetch(e.request).then(function (res) {
            if (res && res.status === 200) cache.put(e.request, res.clone());
            return res;
          }).catch(function () { return cached; });
        });
      })
    );
    return;
  }

  // assets（css/js）：stale-while-revalidate
  if (url.indexOf("/assets/") !== -1) {
    e.respondWith(
      caches.open(CACHE_NAME).then(function (cache) {
        return cache.match(e.request).then(function (cached) {
          var fetchPromise = fetch(e.request).then(function (res) {
            if (res && res.status === 200) cache.put(e.request, res.clone());
            return res;
          }).catch(function () { return cached; });
          return cached || fetchPromise;
        });
      })
    );
    return;
  }
});
