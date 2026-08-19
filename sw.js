/* portfolio Service Worker
 * 目的：首次访问后把图片/字体/视频缓存到本地，
 * 之后每次进来直接秒开，不再重复从服务器加载（解决“每次进来都加载”）。
 * 页面 HTML 用 network-first（保证你更新内容后能看到新版本），
 * 静态资源用 cache-first（一次加载，长期复用）。
 */
const CACHE = 'portfolio-cache-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

function isAsset(url) {
  const p = url.pathname;
  return p.includes('/assets/') || p.includes('/fonts/') || p.includes('/videos/');
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 不碰跨域请求

  // 页面本身（含子路径）：network-first，失败回退缓存
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => { putCache(req, r.clone()); return r; })
        .catch(() => caches.match(req).then((m) => m || caches.match(self.location.origin + '/portfolio/')))
    );
    return;
  }

  // 静态资源：cache-first
  if (isAsset(url)) {
    e.respondWith(
      caches.match(req).then((m) =>
        m || fetch(req).then((r) => { putCache(req, r.clone()); return r; })
      )
    );
  }
});

function putCache(req, res) {
  if (!res || res.status !== 200 || res.type === 'error') return;
  caches.open(CACHE).then((c) => c.put(req, res));
}
