// SETSIGN 서비스 워커: 앱 설치와 오프라인 화면용. API·영상은 캐시하지 않아요.
const CACHE = 'setsign-v2';
const SHELL = ['./', 'index.html', 'assets/site.css', 'assets/ui.js', 'assets/shop.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/api/') || url.pathname.endsWith('.mp4') || req.headers.has('range')) return;
  if (req.mode === 'navigate') {            // 페이지: 새 버전 우선, 오프라인이면 그 페이지(없으면 홈)를 저장본으로
    e.respondWith(fetch(req).then(res => { if (res.ok && !url.search) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'))));
    return;
  }
  // 그 밖(글꼴·스크립트·그림): 저장본을 바로 쓰고, 뒤에서 새 버전으로 바꿔 둬요
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; });
    return hit ? (net.catch(() => {}), hit) : net;
  }));
});
