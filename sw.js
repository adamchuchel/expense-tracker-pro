const CACHE_NAME = 'expense-tracker-v4-offline';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './auth.js',
    './db.js',
    './offline.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Install Service Worker
self.addEventListener('install', event => {
    console.log('🔧 Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Service Worker
self.addEventListener('activate', event => {
    console.log('✅ Service Worker activated');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Strategy: Network First, fallback to Cache
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip external API calls
    if (url.origin !== location.origin && 
        !url.hostname.includes('cdn.') && 
        !url.hostname.includes('cdnjs.') &&
        !url.hostname.includes('googleapis.com')) {
        return;
    }
    
    event.respondWith(
        fetch(event.request)
            .then(response => {
                const responseToCache = response.clone();
                
                if (response.status === 200) {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                
                return response;
            })
            .catch(() => {
                return caches.match(event.request)
                    .then(response => {
                        if (response) {
                            return response;
                        }
                        
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});

console.log('✅ Service Worker loaded');
