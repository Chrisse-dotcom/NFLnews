const CACHE = 'nfl-news-v1';
const SHELL = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './apple-touch-icon.png'
];

// Install: cache app shell
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
    );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// Fetch: network-first for API calls, cache-first for app shell
self.addEventListener('fetch', event => {
    const url = event.request.url;

    // Always go network-first for API / external requests
    if (url.includes('espn.com') || url.includes('mymemory') || url.includes('api.')) {
        event.respondWith(fetch(event.request).catch(() => new Response('{"error":"offline"}', {
            headers: { 'Content-Type': 'application/json' }
        })));
        return;
    }

    // Cache-first for app shell
    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
            if (res.ok) {
                const clone = res.clone();
                caches.open(CACHE).then(c => c.put(event.request, clone));
            }
            return res;
        }))
    );
});
