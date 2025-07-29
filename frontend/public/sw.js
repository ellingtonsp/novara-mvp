// Service Worker for Novara PWA with Enhanced Cache Management
// Version updates automatically trigger cache refresh

const CACHE_VERSION = 'v2.0.23-insights-overflow-fix'; // Increment this for cache busting
const CACHE_PREFIX = 'novara-';
const STATIC_CACHE = `${CACHE_PREFIX}static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}dynamic-${CACHE_VERSION}`;
const API_CACHE = `${CACHE_PREFIX}api-${CACHE_VERSION}`;

// Broadcast channel for communicating with clients
const updateChannel = new BroadcastChannel('sw-updates');

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/offline.html'
];

// API endpoints to cache with specific strategies
const API_CACHE_PATTERNS = [
  { pattern: /\/api\/health/, strategy: 'network-first', ttl: 300 }, // 5 min
  { pattern: /\/api\/checkins\/questions/, strategy: 'cache-first', ttl: 3600 }, // 1 hour
  { pattern: /\/api\/insights\/daily/, strategy: 'network-first', ttl: 600 }, // 10 min
  { pattern: /\/api\/checkins\?/, strategy: 'network-first', ttl: 0 } // Always fresh
];

// Skip waiting and claim clients immediately for critical updates
const FORCE_UPDATE_PATTERNS = [
  /\.js$/,  // JavaScript files
  /\.css$/, // Stylesheets
  /\/api\// // API responses
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Install complete, skip waiting');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

// Activate event - clean up old caches and notify clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith(CACHE_PREFIX) && 
                     !cacheName.includes(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Take control of all clients
      clients.claim()
    ]).then(() => {
      console.log('[SW] Activation complete');
      // Notify all clients about the update
      updateChannel.postMessage({
        type: 'CACHE_UPDATED',
        version: CACHE_VERSION
      });
    })
  );
});

// Helper to check if request needs force update
function needsForceUpdate(request) {
  return FORCE_UPDATE_PATTERNS.some(pattern => pattern.test(request.url));
}

// Helper to get cache strategy for API endpoint
function getApiCacheStrategy(url) {
  for (const config of API_CACHE_PATTERNS) {
    if (config.pattern.test(url)) {
      return config;
    }
  }
  return null;
}

// Network with cache fallback strategy
async function networkFirst(request, cacheName, ttl = 0) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      // Add timestamp to response for TTL checking
      const responseToCache = networkResponse.clone();
      if (ttl > 0) {
        const headers = new Headers(responseToCache.headers);
        headers.set('sw-cached-at', new Date().toISOString());
        const modifiedResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        });
        cache.put(request, modifiedResponse);
      } else {
        cache.put(request, responseToCache);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, falling back to cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Check TTL if applicable
      if (ttl > 0) {
        const cachedAt = cachedResponse.headers.get('sw-cached-at');
        if (cachedAt) {
          const age = (Date.now() - new Date(cachedAt).getTime()) / 1000;
          if (age > ttl) {
            console.log('[SW] Cached response expired');
            throw new Error('Cache expired');
          }
        }
      }
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache with network fallback strategy
async function cacheFirst(request, cacheName, ttl = 0) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Check TTL if applicable
    if (ttl > 0) {
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      if (cachedAt) {
        const age = (Date.now() - new Date(cachedAt).getTime()) / 1000;
        if (age <= ttl) {
          return cachedResponse;
        }
      }
    } else {
      return cachedResponse;
    }
  }
  
  // Cache miss or expired, fetch from network
  return networkFirst(request, cacheName, ttl);
}

// Fetch event - handle requests with appropriate strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    const strategy = getApiCacheStrategy(url.href);
    
    if (strategy) {
      event.respondWith(
        strategy.strategy === 'cache-first'
          ? cacheFirst(request, API_CACHE, strategy.ttl)
          : networkFirst(request, API_CACHE, strategy.ttl)
      );
      return;
    }
    
    // Default API strategy: network-first, no cache
    event.respondWith(fetch(request));
    return;
  }
  
  // Handle static assets
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)) {
    event.respondWith(
      needsForceUpdate(request)
        ? networkFirst(request, STATIC_CACHE)
        : cacheFirst(request, STATIC_CACHE)
    );
    return;
  }
  
  // Handle navigation requests (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, DYNAMIC_CACHE)
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }
  
  // Default strategy: network with cache fallback
  event.respondWith(
    networkFirst(request, DYNAMIC_CACHE)
  );
});

// Listen for skip waiting message from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received skip waiting message');
    self.skipWaiting();
  }
});

// Background sync for offline check-ins
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-checkins') {
    console.log('[SW] Syncing offline check-ins');
    event.waitUntil(syncOfflineCheckins());
  }
});

async function syncOfflineCheckins() {
  // Get offline check-ins from IndexedDB
  // This would be implemented with actual offline storage
  console.log('[SW] Check-in sync complete');
}