// Space Voyage - Service Worker
// Version 2.10.173

const CACHE_VERSION = '2.10.179';
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
    './src/modules/storage.js',
    './src/modules/AppFeatures.js',
  './src/i18n.js',
  './src/bootstrap/installPromptCapture.js',
  './src/bootstrap/initManagers.js',
  './src/modules/SceneManager.js',
  './src/modules/SolarSystemModule.js',
  './src/modules/TextureCache.js',
  './src/modules/UIManager.js',
  './src/modules/PanelManager.js',
  './src/modules/PWAManager.js',
  './src/modules/ServiceWorkerManager.js',
  './src/modules/LanguageManager.js',
  './src/modules/AudioManager.js',
  './src/modules/storage.js',
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
  './icons/manifest-icon-512.maskable.png',
  // Planet textures (self-hosted)
  './textures/planets/sun.jpg',
  './textures/planets/mercury.jpg',
  './textures/planets/venus.jpg',
  './textures/planets/earth_1k.jpg',
  './textures/planets/mars_1k.jpg',
  './textures/planets/jupiter.jpg',
  './textures/planets/saturn.jpg',
  './textures/planets/uranus.jpg',
  './textures/planets/neptune.jpg',
  // Moon textures
  './textures/moons/moon_1k.jpg',
  './textures/moons/moon_threejs_1k.jpg',
  './textures/moons/io_2k.jpg',
  './textures/moons/europa_2k.jpg',
  './textures/moons/ganymede_2k.jpg',
  './textures/moons/callisto_2k.jpg',
  './textures/moons/titan_2k.jpg',
  './textures/moons/enceladus_2k.jpg',
  './textures/moons/rhea_2k.jpg',
  './textures/moons/triton_2k.jpg',
  './textures/moons/titania_2k.jpg',
  './textures/moons/miranda_2k.jpg',
  './textures/moons/charon_2k.jpg',
  // Mars moons - real textures
  './textures/moons/phobos_2k.jpg',
  './textures/moons/deimos_2k.jpg',
  // Saturn ring texture
  './textures/rings/saturn_ring_alpha.png',
  // Nebulae - real Hubble imagery
  './textures/nebulae/orion_nebula.jpg',
  './textures/nebulae/crab_nebula.jpg',
  './textures/nebulae/ring_nebula.jpg',
  // Galaxies - real Hubble imagery
  './textures/galaxies/andromeda_galaxy.jpg',
  './textures/galaxies/whirlpool_galaxy.jpg',
  './textures/galaxies/sombrero_galaxy.jpg',
  // Dwarf planet textures
  './textures/dwarf-planets/pluto_2k.jpg',
  './textures/dwarf-planets/ceres_2k.jpg',
  './textures/dwarf-planets/haumea_2k.jpg',
  './textures/dwarf-planets/makemake_2k.jpg',
  './textures/dwarf-planets/eris_2k.jpg'
];

// CDN files to cache (Three.js and dependencies)
const CDN_CACHE_FILES = [
  'https://cdn.jsdelivr.net/npm/three@0.183.0/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.183.0/examples/jsm/controls/OrbitControls.js',
  'https://cdn.jsdelivr.net/npm/three@0.183.0/examples/jsm/renderers/CSS2DRenderer.js',
  'https://cdn.jsdelivr.net/npm/three@0.183.0/examples/jsm/webxr/XRControllerModelFactory.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Cache static files
        await cache.addAll(STATIC_CACHE_FILES);
        
        // Try to cache CDN files in parallel (don't fail if they're not available)
        await Promise.allSettled(CDN_CACHE_FILES.map(url => cache.add(url)));
        
        // Notify clients that a new SW is installed and waiting
        broadcastMessage({ type: 'SW_INSTALLED', version: CACHE_VERSION });
        // Do NOT call self.skipWaiting() here — let the client show the
        // update notification first; skipWaiting is triggered via the
        // SKIP_WAITING message when the user clicks "Update".
      } catch (error) {
        // console.error('[SW] Installation failed:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const validCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE];
      
      await Promise.all(
        cacheNames
          .filter(name => !validCaches.includes(name))
          .map(name => caches.delete(name))
      );
      
      // Take control of all clients immediately
      await self.clients.claim();
      broadcastMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
    })()
  );
});

// Helper function to determine cache strategy
function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

function shouldNormalizeCacheKey(request, url) {
  if (url.origin !== location.origin) {
    return false;
  }

  if (isNavigationRequest(request)) {
    return true;
  }

  if (['script', 'style', 'image', 'font', 'manifest', 'worker'].includes(request.destination)) {
    return true;
  }

  return /\.(css|js|mjs|json|woff2?|ttf|eot|jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname);
}

function getCacheKey(request, url) {
  return shouldNormalizeCacheKey(request, url) ? `${url.origin}${url.pathname}` : request;
}

function getCacheStrategy(request, url) {
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
  if (isNavigationRequest(request) || url.pathname.match(/\.html?$/i) || url.pathname === '/' || url.pathname.endsWith('/')) {
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
        const { cache, strategy, limit } = getCacheStrategy(request, url);
        const cacheKey = getCacheKey(request, url);
        
        if (strategy === 'network-first') {
          // Try network first, fallback to cache
          try {
            const networkResponse = await fetch(request);
            if (networkResponse && networkResponse.status === 200) {
              const cacheStorage = await caches.open(cache);
              await cacheStorage.put(cacheKey, networkResponse.clone());
            }
            return networkResponse;
          } catch (error) {
            const cachedResponse = await caches.match(cacheKey);
            if (cachedResponse) {
              return cachedResponse;
            }
            throw error;
          }
        } else {
          // Cache first strategy (default)
          // ignoreSearch: true allows versioned URLs (e.g. ?v=2.10.6) to match
          // plain paths stored in the SW install cache, ensuring offline reliability
          const cachedResponse = await caches.match(cacheKey);
          if (cachedResponse) {
            // Return cached version and update in background
            // Skip revalidation for immutable CDN resources (versioned URLs can't change)
            const reqUrl = new URL(request.url);
            if (!reqUrl.hostname.includes('jsdelivr.net')) {
              event.waitUntil(updateCache(request, cache, cacheKey));
            }
            return cachedResponse;
          }
          
          // If not in cache, fetch from network
          const networkResponse = await fetch(request);
          
          // Cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            const cacheStorage = await caches.open(cache);
            await cacheStorage.put(cacheKey, networkResponse.clone());
            
            // Enforce cache limits if specified
            if (limit) {
              event.waitUntil(trimCache(cache, limit));
            }
          }
          
          return networkResponse;
        }
      } catch (error) {
        // console.error('[SW] Fetch failed:', error);

        if (!isNavigationRequest(request)) {
          return Response.error();
        }
        
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
async function updateCache(request, cacheName = CACHE_NAME, cacheKey = request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      await cache.put(cacheKey, response);
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
    }
  } catch (error) {
    // Silently fail - cache trimming is optimization
  }
}

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting().then(() => {
      broadcastMessage({ type: 'SW_SKIP_WAITING_COMPLETE', version: CACHE_VERSION });
    });
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Broadcast helper to send messages to all window clients
function broadcastMessage(message) {
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
    for (const client of clients) {
      client.postMessage(message);
    }
  });
}



