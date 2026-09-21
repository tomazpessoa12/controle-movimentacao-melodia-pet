const CACHE = 'melodia-movimentacao-v1.1.6';
const ASSETS = [
  '/', '/producao', '/logistica', '/admin', '/producao.html', '/logistica.html', '/admin.html', '/style.css', '/app.js',
  '/vendor/jsQR.js', '/melodia-logo.png', '/manifest.webmanifest', '/manifest-producao.webmanifest', '/manifest-logistica.webmanifest', '/manifest-admin.webmanifest',
  '/icons/icon-192.png', '/icons/icon-512.png'
];

self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/producao'))));
});
