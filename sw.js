/* portfolio Service Worker
 * v3：HTML 永远走网络、绝不缓存，避免用户看到旧/坏缓存版本导致空白。
 * 仅对图片/字体/视频等静态资源做 cache-first，加速二次访问。
 */
const CACHE = 'portfolio-cache-v3';

self.addEventListener('install', (e) => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k.startsWith('portfolio-cache-') && k !== CACHE).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

function isAsset(url) {
  const p = url.pathname;
  return p.includes('/assets/') || p.includes('/fonts/') || p.includes('/videos/');
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // 页面 HTML 始终请求最新版本，不写入缓存
    e.respondWith(fetch(req).catch(() => caches.match(self.location.origin + '/portfolio/')));
    return;
  }

  if (isAsset(url)) {
    e.respondWith(
      caches.match(req).then((m) =>
        m || fetch(req).then((r) => {
          if (r && r.status === 200 && r.type !== 'error') {
            caches.open(CACHE).then((c) => c.put(req, r.clone())).catch(() => {});
          }
          return r;
        })
      )
    );
  }
});
