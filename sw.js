// Service Worker for Modern Estate Manager
const CACHE_NAME = 'estate-manager-v2.0.0';
const STATIC_CACHE = 'static-v2.0.0';
const DYNAMIC_CACHE = 'dynamic-v2.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/',
    '/index.html',
    '/src/styles/main.css',
    '/src/app.js',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache static files', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                // Return cached version if available
                if (cachedResponse) {
                    console.log('Service Worker: Serving from cache', request.url);
                    return cachedResponse;
                }
                
                // Otherwise fetch from network
                return fetch(request)
                    .then(response => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        // Cache dynamic content
                        if (shouldCache(request)) {
                            caches.open(DYNAMIC_CACHE)
                                .then(cache => {
                                    cache.put(request, responseToCache);
                                });
                        }
                        
                        return response;
                    })
                    .catch(error => {
                        console.error('Service Worker: Fetch failed', error);
                        
                        // Return offline page for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        // Return a custom offline response for other requests
                        return new Response(
                            JSON.stringify({
                                error: 'Offline',
                                message: 'لا يمكن الوصول للشبكة. يرجى المحاولة لاحقاً.'
                            }),
                            {
                                status: 503,
                                statusText: 'Service Unavailable',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            }
                        );
                    });
            })
    );
});

// Background sync for offline data
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync triggered', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            syncOfflineData()
        );
    }
});

// Push notification handling
self.addEventListener('push', event => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'إشعار جديد من مدير الاستثمار العقاري',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏛️</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏛️</text></svg>',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'عرض',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">👁️</text></svg>'
            },
            {
                action: 'close',
                title: 'إغلاق',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">❌</text></svg>'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('مدير الاستثمار العقاري', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Helper functions
function shouldCache(request) {
    const url = new URL(request.url);
    
    // Cache API requests
    if (url.pathname.startsWith('/api/')) {
        return true;
    }
    
    // Cache static assets
    if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
        return true;
    }
    
    // Cache HTML pages
    if (request.mode === 'navigate') {
        return true;
    }
    
    return false;
}

async function syncOfflineData() {
    try {
        console.log('Service Worker: Syncing offline data...');
        
        // Get offline data from IndexedDB or localStorage
        const offlineData = await getOfflineData();
        
        if (offlineData && offlineData.length > 0) {
            // Sync with server
            for (const item of offlineData) {
                try {
                    await fetch('/api/sync', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(item)
                    });
                } catch (error) {
                    console.error('Service Worker: Failed to sync item', error);
                }
            }
            
            // Clear offline data after successful sync
            await clearOfflineData();
            console.log('Service Worker: Offline data synced successfully');
        }
    } catch (error) {
        console.error('Service Worker: Sync failed', error);
    }
}

async function getOfflineData() {
    // This would typically read from IndexedDB
    // For now, return empty array
    return [];
}

async function clearOfflineData() {
    // This would typically clear from IndexedDB
    // For now, do nothing
}

// Message handling for communication with main thread
self.addEventListener('message', event => {
    console.log('Service Worker: Message received', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        const urlsToCache = event.data.urls;
        event.waitUntil(
            caches.open(DYNAMIC_CACHE)
                .then(cache => cache.addAll(urlsToCache))
        );
    }
});

console.log('Service Worker: Loaded successfully');