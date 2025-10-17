// sw.js (reemplaza el tuyo; incrementa CACHE_VERSION cuando publiques cambios)
const CACHE_VERSION = 'v3'; // incrementa cuando actualices
const CACHE_NAME = `miplayer-shell-${CACHE_VERSION}`;
const OFFLINE_URL = './index.html';
const ASSETS_TO_CACHE = [
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting()) // activa esta versión inmediatamente
  );
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => { if (k !== CACHE_NAME) return caches.delete(k); }))
    ).then(() => self.clients.claim()) // tomar control inmediato
  );
});

self.addEventListener('fetch', (evt) => {
  const req = evt.request;
  const url = new URL(req.url);

  // No cache YouTube/media (lo dejas así si ya lo tenías)
  if (url.hostname.includes('youtube.com') || url.hostname.includes('ytimg.com') || url.pathname.endsWith('.mp4')) {
    return;
  }

  // Network-first para HTML (muestra cambios rápido), cache-first para otros activos
  if (req.method === 'GET' && req.headers.get('accept')?.includes('text/html')) {
    evt.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  evt.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if(req.method === 'GET' && res && res.type === 'basic'){
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      }
      return res;
    })).catch(() => {
      if (req.headers.get('accept')?.includes('text/html')) return caches.match(OFFLINE_URL);
    })
  );
});
