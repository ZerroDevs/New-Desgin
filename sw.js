const CACHE_NAME = 'zeronux-store-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/products.html', // Assuming this exists or meant to be cached
    '/cart.html',     // If exists
    '/manifest.json',
    '/Images/Logo.png',
    '/Scripts/app.js',
    '/Scripts/cart.js',
    '/Scripts/firebase-config.js',
    '/Scripts/instant-page.js',
    // Add other core CSS/Images if known, but Strategy handles dynamic caching
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap'
];

// Install Event - Cache Core Assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Caching core assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting(); // Activate immediately
});

// Activate Event - Cleanup Old Caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('SW: Clearing old cache', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Network First for HTML, Cache First for Assets, Stale-While-Revalidate for others
self.addEventListener('fetch', (event) => {
    const isHTML = event.request.headers.get('accept').includes('text/html');
    const isImage = event.request.destination === 'image';
    const isStyle = event.request.destination === 'style';
    const isScript = event.request.destination === 'script';

    // Strategy 1: Network First for HTML (Fresh content matters)
    if (isHTML) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Update cache with fresh version
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if offline
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Strategy 2: Cache First (falling back to network) for Static Assets
    if (isImage || isStyle || isScript) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request)
                    .then((response) => {
                        // Check for valid response before caching
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const clonedResponse = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
                        return response;
                    })
                    .catch((err) => {
                        // Prevent "Uncaught (in promise) TypeError: Failed to fetch"
                        // Silently fail or return 404/Offline placeholder
                        console.warn('SW: Fetch failed for ' + event.request.url);
                        return new Response('', { status: 404, statusText: 'Not Found' });
                    });
            })
        );
        return;
    }

    // Default: Network First
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
