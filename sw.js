/* UNHINGED WARFARE — Service Worker (offline-first).
 * La shell resta disponibile dopo il precache riuscito; Three.js viene dal CDN
 * e quindi richiede rete se non è già presente nella cache del browser.
 */
const VERSION = 'v1.5.0-release-qa';
const CACHE = 'unhinged-warfare-' + VERSION;

const PRECACHE = [
  'gioca.html',
  'index.html',
  'manifest.json',
  'css/style.css',
  'js/i18n.js',
  'js/save.js',
  'js/audio.js',
  'js/render.js',
  'js/data.js',
  'js/engine.js',
  'js/arena.js',
  'js/ui.js',
  'js/clip.js',
  'js/threeboot.js',
  'js/main.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-64.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    /* addAll è atomico: se una risorsa manca, l'install fallisce.
       Con add individuale il gioco parte comunque in rete debole. */
    await Promise.all(PRECACHE.map((u) =>
      cache.add(new Request(u, { cache: 'reload' })).catch(() => {})
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => k.startsWith('unhinged-warfare-') && k !== CACHE)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  /* Navigazioni: prova la rete, poi la cache, poi gioca.html (offline shell) */
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        return await fetch(req);
      } catch (err) {
        const cache = await caches.open(CACHE);
        const hit = await cache.match(req, { ignoreSearch: true });
        return hit || await cache.match('gioca.html') || Response.error();
      }
    })());
    return;
  }

  /* Stessa origine (js/css/icone): cache-first + runtime cache */
  if (req.url.startsWith(self.location.origin)) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch (err) {
        return Response.error();
      }
    })());
  }
  /* richieste cross-origin: lasciate alla rete */
});
