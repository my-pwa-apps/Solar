// Space Explorer - Service Worker
// Version 1.0.0

const CACHE_NAME = 'space-explorer-v1.0.0';
const RUNTIME_CACHE = 'space-explorer-runtime-v1.0.0';

// Files to cache immediately on install
const STATIC_CACHE_FILES = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/styles/main.css',
  '/src/styles/ui.css',
  '/manifest.json'
];

// CDN files to cache (Three.js)
const CDN_CACHE_FILES = [
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('[Service Worker] Caching static files');
        
        // Cache static files
        await cache.addAll(STATIC_CACHE_FILES);
        
        // Try to cache CDN files (don't fail if they're not available)
        for (const url of CDN_CACHE_FILES) {
          try {
            await cache.add(url);
          } catch (err) {
            console.warn(`[Service Worker] Could not cache: ${url}`, err);
          }
        }
        
        console.log('[Service Worker] Static files cached successfully');
        
        // Force the waiting service worker to become the active service worker
        await self.skipWaiting();
      } catch (error) {
        console.error('[Service Worker] Installation failed:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => {
            console.log(`[Service Worker] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
      
      // Take control of all clients immediately
      await self.clients.claim();
      console.log('[Service Worker] Activated successfully');
    })()
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests that aren't from CDN
  if (url.origin !== location.origin && !url.hostname.includes('jsdelivr.net')) {
    return;
  }
  
  // Skip chrome-extension and other special protocols
  if (!request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    (async () => {
      try {
        // Try cache first (Cache First strategy for static assets)
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          // Return cached version and update in background
          event.waitUntil(updateCache(request));
          return cachedResponse;
        }
        
        // If not in cache, fetch from network
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(RUNTIME_CACHE);
          // Clone the response before caching
          cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        console.error('[Service Worker] Fetch failed:', error);
        
        // If offline and no cache, return offline page
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match('/index.html');
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Return a basic offline response
        return new Response(
          `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Space Explorer - Offline</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #000011 0%, #1a1a2e 100%);
                color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                text-align: center;
              }
              .offline-content {
                padding: 2rem;
              }
              h1 {
                font-size: 3rem;
                margin-bottom: 1rem;
              }
              p {
                font-size: 1.2rem;
                opacity: 0.8;
              }
              button {
                margin-top: 2rem;
                padding: 1rem 2rem;
                font-size: 1rem;
                background: #0078D4;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              }
              button:hover {
                background: #106ebe;
              }
            </style>
          </head>
          <body>
            <div class="offline-content">
              <h1>🌌 Offline</h1>
              <p>You're currently offline. Please check your internet connection.</p>
              <button onclick="window.location.reload()">Try Again</button>
            </div>
          </body>
          </html>`,
          {
            headers: { 'Content-Type': 'text/html' }
          }
        );
      }
    })()
  );
});

// Update cache in background (stale-while-revalidate)
async function updateCache(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response);
    }
  } catch (error) {
    // Silently fail - we're already serving from cache
  }
}

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Background sync for offline actions (if needed in future)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  // Future: sync user preferences, saved states, etc.
});

// Push notifications support (if needed in future)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    tag: 'space-explorer-notification',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification('Space Explorer', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[Service Worker] Loaded successfully');
