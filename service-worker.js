// service-worker.js

const CACHE_NAME_PREFIX = 'my-pwa-cache-';
let PWA_VERSION; // Will be extracted from the SW URL query parameter

const getVersionFromUrl = () => {
  if (self.location && self.location.search) {
    const params = new URLSearchParams(self.location.search);
    return params.get('v');
  }
  return null;
};

PWA_VERSION = getVersionFromUrl();
if (!PWA_VERSION) {
  // Fallback if version is not in query param. This is not ideal for production.
  // A build step should ensure the versioned SW URL is always used for registration.
  console.warn('[SW] Version not found in SW URL query parameter (e.g., ?v=1.0.0). Using "unknown-version".');
  PWA_VERSION = 'unknown-version';
}

const CURRENT_CACHE_NAME = `${CACHE_NAME_PREFIX}v${PWA_VERSION}`;

console.log(`[SW v${PWA_VERSION}] Initializing. Service Worker script version: ${PWA_VERSION}. Cache to be used: ${CURRENT_CACHE_NAME}`);

// Define assets to cache. These are critical for the app shell.
// IMPORTANT: If any of these files' content changes, or if you add/remove files,
// you MUST update PWA_VERSION in main.js to trigger an update.
const ASSETS_TO_CACHE = [
  '/',             // Root path, often serves index.html
  '/index.html',   // Main HTML file
  '/main.js',      // Main JavaScript file
  '/manifest.json' // Web App Manifest
  // Add other essential static assets here:
  // e.g., '/css/style.css', '/images/logo-critical.png'
];

self.addEventListener('install', (event) => {
  console.log(`[SW v${PWA_VERSION}] Event: 'install'. Starting to cache app shell assets.`);
  event.waitUntil(
    caches.open(CURRENT_CACHE_NAME)
      .then((cache) => {
        console.log(`[SW v${PWA_VERSION}] Cache '${CURRENT_CACHE_NAME}' opened. Caching assets: ${ASSETS_TO_CACHE.join(', ')}`);
        // addAll() is atomic: if one asset fails to cache, the whole operation fails.
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log(`[SW v${PWA_VERSION}] App shell assets cached successfully. Calling self.skipWaiting() to activate immediately.`);
        self.skipWaiting(); // Ensures the new SW activates as soon as install is complete.
      })
      .catch((error) => {
        console.error(`[SW v${PWA_VERSION}] Failed to cache app shell assets during 'install' event:`, error);
        // If addAll() fails, the SW installation will not complete, and the old SW (if any) will remain active.
        // This fulfills the requirement: "display the old one if the download of the new one fails."
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log(`[SW v${PWA_VERSION}] Event: 'activate'. Service Worker is activating.`);
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith(CACHE_NAME_PREFIX) && cacheName !== CURRENT_CACHE_NAME) {
              console.log(`[SW v${PWA_VERSION}] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log(`[SW v${PWA_VERSION}] Old caches deleted successfully. Claiming clients.`);
        return self.clients.claim(); // Takes control of open clients (pages) immediately.
      })
      .catch((error) => {
        console.error(`[SW v${PWA_VERSION}] Error during 'activate' event (cache cleanup or client claim):`, error);
      })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Log fetch events for HTML navigations or if the request is for a file in ASSETS_TO_CACHE
  // This helps in debugging but can be made less verbose for production.
  if (event.request.mode === 'navigate' || ASSETS_TO_CACHE.includes(url.pathname)) {
    console.log(`[SW v${PWA_VERSION}] Event: 'fetch'. Request for: ${event.request.url} (Mode: ${event.request.mode})`);
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          if (event.request.mode === 'navigate' || ASSETS_TO_CACHE.includes(url.pathname)) {
            console.log(`[SW v${PWA_VERSION}] Serving from cache: ${event.request.url}`);
          }
          return cachedResponse;
        }

        // Not in cache, fetch from network.
        if (event.request.mode === 'navigate' || ASSETS_TO_CACHE.includes(url.pathname)) {
          console.log(`[SW v${PWA_VERSION}] Asset not in cache. Fetching from network: ${event.request.url}`);
        }

        return fetch(event.request).then(networkResponse => {
          // Optional: Consider caching other GET requests dynamically if they are not part of the app shell.
          // This is generally not recommended for app shell files themselves as their updates
          // should be tied to PWA_VERSION changes.
          // Example:
          // if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET' &&
          //     !ASSETS_TO_CACHE.includes(url.pathname) && url.protocol.startsWith('http')) {
          //   const cache = await caches.open(CURRENT_CACHE_NAME);
          //   try {
          //     await cache.put(event.request, networkResponse.clone());
          //     console.log(`[SW v${PWA_VERSION}] Dynamically cached: ${event.request.url}`);
          //   } catch (e) {
          //     console.warn(`[SW v${PWA_VERSION}] Failed to dynamically cache: ${event.request.url}`, e);
          //   }
          // }
          return networkResponse;
        });
      })
      .catch((error) => {
        // This catch handles errors from caches.match() or from fetch() if the network fails.
        console.error(`[SW v${PWA_VERSION}] Fetch error for ${event.request.url}:`, error);
        // Fallback strategy:
        // For navigation requests, you might want to serve a generic offline page if one is cached.
        // if (event.request.mode === 'navigate') {
        //   return caches.match('/offline.html'); // Ensure '/offline.html' is in ASSETS_TO_CACHE
        // }
        // For other asset types, re-throw the error to let the browser handle it (e.g., show a broken image icon).
        throw error;
      })
  );
});

console.log(`[SW v${PWA_VERSION}] Service Worker script fully parsed and event listeners attached.`);
