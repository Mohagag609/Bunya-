const CACHE_NAME = 'estate-pro-cache-v' + Date.now(); // Dynamic cache name
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/app.js',
    '/db.js',
    '/style.css',
    '/manifest.json',
    'https://unpkg.com/htmx.org@1.9.10',
    'https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/sql-wasm.js',
    'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/sql-wasm.wasm'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache and caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        // Always fetch from network first, never use cache
        fetch(event.request)
            .then((response) => {
                // Update cache with fresh content
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Only use cache as fallback if network fails
                return caches.match(event.request);
            })
    );
});
