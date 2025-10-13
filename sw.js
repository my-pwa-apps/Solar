// Space Voyage - Service Worker
// Version 2.1.4 - Fixed Windows taskbar icon caching

const CACHE_VERSION = '2.1.4';
const CACHE_NAME = `space-voyage-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `space-voyage-runtime-v${CACHE_VERSION}`;
const IMAGE_CACHE = `space-voyage-images-v${CACHE_VERSION}`;

// Cache size limits (in number of items)
const CACHE_LIMITS = {
  runtime: 100,
  images: 50
};

// Files to cache immediately on install
const STATIC_CACHE_FILES = [
  './',
  './index.html',
  './src/main.js',
  './src/i18n.js',
  './src/modules/SceneManager.js',
  './src/modules/SolarSystemModule.js',
  './src/modules/TextureCache.js',
  './src/modules/UIManager.js',
  './src/modules/utils.js',
  './src/styles/main.css',
  './src/styles/ui.css',
  './manifest.json',
  './manifest.nl.json',
  './manifest.fr.json',
  './manifest.de.json',
  './manifest.es.json',
  './manifest.pt.json',
  './browserconfig.xml',
  './favicon.ico',
  // Windows taskbar and Start Menu icons (critical for PWA)
  './icons/windows11/Square44x44Logo.altform-unplated_targetsize-16.png',
  './icons/windows11/Square44x44Logo.altform-unplated_targetsize-24.png',
  './icons/windows11/Square44x44Logo.altform-unplated_targetsize-32.png',
  './icons/windows11/Square44x44Logo.altform-unplated_targetsize-48.png',
  './icons/windows11/Square44x44Logo.altform-unplated_targetsize-256.png',
  './icons/windows11/Square44x44Logo.targetsize-16.png',
  './icons/windows11/Square44x44Logo.targetsize-24.png',
  './icons/windows11/Square44x44Logo.targetsize-32.png',
  './icons/windows11/Square44x44Logo.targetsize-48.png',
  './icons/windows11/Square44x44Logo.targetsize-256.png',
  './icons/manifest-icon-192.maskable.png',
  './icons/manifest-icon-512.maskable.png'
];

// CDN files to cache (Three.js and dependencies)
const CDN_CACHE_FILES = [
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/VRButton.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/XRControllerModelFactory.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Space Voyage v' + CACHE_VERSION);
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('[SW] Caching static files');
        
        // Cache static files
        await cache.addAll(STATIC_CACHE_FILES);
        
        // Try to cache CDN files (don't fail if they're not available)
        for (const url of CDN_CACHE_FILES) {
          try {
            await cache.add(url);
          } catch (err) {
            console.warn(`[SW] Could not cache: ${url}`);
          }
        }
        
        console.log('[SW] Installation complete');
        
        // Force the waiting service worker to become the active service worker
        await self.skipWaiting();
      } catch (error) {
        console.error('[SW] Installation failed:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Space Voyage v' + CACHE_VERSION);
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const validCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE];
      
      await Promise.all(
        cacheNames
          .filter(name => !validCaches.includes(name))
          .map(name => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
      
      // Take control of all clients immediately
      await self.clients.claim();
      console.log('[SW] Activated successfully');
    })()
  );
});

// Helper function to determine cache strategy
function getCacheStrategy(url) {
  // Images - cache first with size limit
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    return { cache: IMAGE_CACHE, strategy: 'cache-first', limit: CACHE_LIMITS.images };
  }
  
  // Static assets - cache first
  if (url.pathname.match(/\.(css|js|woff2?|ttf|eot)$/i) || 
      url.hostname.includes('jsdelivr.net')) {
    return { cache: CACHE_NAME, strategy: 'cache-first' };
  }
  
  // HTML - network first (for updates)
  if (url.pathname.match(/\.html?$/i) || url.pathname === '/') {
    return { cache: CACHE_NAME, strategy: 'network-first' };
  }
  
  // Everything else - runtime cache
  return { cache: RUNTIME_CACHE, strategy: 'cache-first', limit: CACHE_LIMITS.runtime };
}

// Fetch event - intelligent caching strategies
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
  
  // Only cache GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    (async () => {
      try {
        const { cache, strategy, limit } = getCacheStrategy(url);
        
        if (strategy === 'network-first') {
          // Try network first, fallback to cache
          try {
            const networkResponse = await fetch(request);
            if (networkResponse && networkResponse.status === 200) {
              const cacheStorage = await caches.open(cache);
              cacheStorage.put(request, networkResponse.clone());
            }
            return networkResponse;
          } catch (error) {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
              return cachedResponse;
            }
            throw error;
          }
        } else {
          // Cache first strategy (default)
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            // Return cached version and update in background
            event.waitUntil(updateCache(request, cache));
            return cachedResponse;
          }
          
          // If not in cache, fetch from network
          const networkResponse = await fetch(request);
          
          // Cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            const cacheStorage = await caches.open(cache);
            cacheStorage.put(request, networkResponse.clone());
            
            // Enforce cache limits if specified
            if (limit) {
              event.waitUntil(trimCache(cache, limit));
            }
          }
          
          return networkResponse;
        }
      } catch (error) {
        console.error('[SW] Fetch failed:', error);
        
        // If offline and no cache, return offline page
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match('./index.html');
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
            <title>Space Voyage - Offline</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
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
              <h1>Offline</h1>
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
async function updateCache(request, cacheName = CACHE_NAME) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response);
    }
  } catch (error) {
    // Silently fail - we're already serving from cache
  }
}

// Trim cache to specified size limit
async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxItems) {
      // Remove oldest entries (FIFO)
      const keysToDelete = keys.slice(0, keys.length - maxItems);
      await Promise.all(keysToDelete.map(key => cache.delete(key)));
      console.log(`[SW] Trimmed ${keysToDelete.length} items from ${cacheName}`);
    }
  } catch (error) {
    console.error('[SW] Cache trim failed:', error);
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

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  // Future: sync user preferences, saved states, etc.
});

// Push notifications support (future enhancement)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    tag: 'space-voyage-notification',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification('Space Voyage', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./')
  );
});

console.log('[SW] Space Voyage Service Worker v' + CACHE_VERSION + ' loaded');

