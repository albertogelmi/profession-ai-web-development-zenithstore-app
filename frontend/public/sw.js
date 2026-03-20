// ZenithStore Online - Basic Service Worker
// Minimal implementation, does NOT handle push notifications or full offline support

// Name of the cache and list of static assets to cache
const CACHE_NAME = 'zenithstore-cache'
const STATIC_ASSETS = [
  '/', // Cache the root HTML
  '/manifest.json', // Cache the manifest
]

// Install event: cache static assets and activate new worker immediately
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event: remove old caches and take control of all clients
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event: handle GET requests for same-origin resources
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') {
    return
  }
  // Ignore cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }
  // Try network first, fallback to cache for static assets if offline
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request)
      })
  )
})

// Message event: allow client to send SKIP_WAITING to activate new worker immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[Service Worker] Loaded')
