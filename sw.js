/* portfolio Service Worker
 * 目的：首次访问后把图片/字体/视频缓存到本地，
 * 之后每次进来直接秒开，不再重复从服务器加载。
 * 页面 HTML 用 network-first（保证更新后能看到新版本），
 * 静态资源用 cache-first（一次加载，长期复用）。
 * v2：升级缓存名并清理旧缓存，确保修复内容立即生效。
 */
const CACHE = 'portfolio-cache-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('portfolio-cache-') && k !== CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

function isAsset(url) {
  const p = url.pathname;
  return p.includes('/assets/') || p.includes('/fonts/') || p.includes('/videos/');
}

function putCache(req, res) {
  if (!res || res.status !== 200 || res.type === 'error') return Promise.resolve();
  return caches.open(CACHE).then((c) => c.put(req, res)).catch(() => {});
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => putCache(req, r.clone()).then(() => r))
        .catch(() => caches.match(req).then((m) => m || caches.match(self.location.origin + '/portfolio/')))
    );
    return;
  }

  if (isAsset(url)) {
    e.respondWith(
      caches.match(req).then((m) =>
        m || fetch(req).then((r) => putCache(req, r.clone()).then(() => r))
      )
    );
  }
});
