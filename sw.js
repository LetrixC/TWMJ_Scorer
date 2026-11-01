// 番鼠 service worker：網頁先用網絡（有更新即時用新版），冇網先用上次儲低嘅版本
const CACHE = "fansyu-v1";
const CORE = ["/", "/index.html", "/og.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;            // Firebase、字型等交返俾瀏覽器
  if (url.pathname.endsWith("/config.js")) return;       // 設定檔永遠攞最新
  if (/\/fs-[0-9a-f]+\.\w+$/.test(url.pathname) || /\/icon-.*\.png$/.test(url.pathname)) {   // 圖片檔名跟內容變，可以放心用快取
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })));
    return;
  }
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === "navigate" ? caches.match("/index.html") : undefined)))
  );
});
