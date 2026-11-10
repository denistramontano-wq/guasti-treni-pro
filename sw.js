// Service worker Guasti Metro — cambia CACHE ad ogni nuova versione dell'app
const CACHE = 'guasti-metro-colleghi-v4.1.0';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Dati Firebase: sempre dalla rete (il SDK gestisce da solo la coda offline)
  if (url.hostname.endsWith('firebasedatabase.app') || url.hostname.endsWith('firebaseio.com')) return;

  // Pagina: prima la rete (così gli aggiornamenti arrivano subito), poi la cache
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Resto (icone, script Firebase): prima la cache
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
