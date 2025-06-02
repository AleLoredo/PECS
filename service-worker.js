// service-worker.js

const CACHE_NAME = 'fases-app-cache-v1.2'; // Incrementa la versión si cambias los archivos cacheados
const urlsToCache = [
  '/', // Cachea la raíz
  'index.html', // Cachea el archivo HTML principal
  // No es necesario cachear Tailwind CSS explícitamente aquí, el navegador lo hará.
  // Las imágenes son de CDN, el navegador y la estrategia de fetch las manejarán.
  // Puedes agregar aquí íconos locales o fuentes si las tuvieras.
];

// Evento de instalación: se dispara cuando el SW se instala por primera vez.
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Abriendo cache y cacheando archivos principales:', urlsToCache);
        // Usamos map para crear un array de Requests con la opción 'reload' para asegurar que se obtienen de la red en la primera instalación.
        const cachePromises = urlsToCache.map(urlToCache => {
            return cache.add(new Request(urlToCache, {cache: 'reload'})).catch(err => {
                console.warn(`[ServiceWorker] Fallo al cachear ${urlToCache} durante la instalación:`, err);
            });
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('[ServiceWorker] Archivos principales cacheados exitosamente.');
        // Forzar la activación del nuevo Service Worker inmediatamente
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[ServiceWorker] Fallo en la instalación del cache:', error);
      })
  );
});

// Evento de activación: se dispara después de la instalación y cuando una nueva versión del SW toma el control.
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Borrando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[ServiceWorker] Cache antigua borrada, tomando control de clientes.');
        // Tomar control de los clientes (pestañas abiertas) inmediatamente
        return self.clients.claim();
    })
  );
});

// Evento fetch: se dispara cada vez que la aplicación solicita un recurso (HTML, CSS, JS, imágenes, etc.).
self.addEventListener('fetch', event => {
  // Solo manejar peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Estrategia: Cache First, then Network for navigation requests (HTML)
  // Para peticiones de navegación (documentos HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request)
          .then(response => {
            // Si está en caché, devolverlo
            if (response) {
              console.log(`[ServiceWorker] Sirviendo desde caché (navigate): ${event.request.url}`);
              return response;
            }
            // Si no, ir a la red
            console.log(`[ServiceWorker] No en caché, buscando en red (navigate): ${event.request.url}`);
            return fetch(event.request).then(networkResponse => {
              // Cachear la respuesta de la red para futuras peticiones
              if (networkResponse && networkResponse.ok) {
                // Es importante clonar la respuesta. Una respuesta es un stream y
                // como queremos que el navegador consuma la respuesta, así como
                // la caché consuma la respuesta, necesitamos clonarla para tener dos streams.
                const responseToCache = networkResponse.clone();
                cache.put(event.request, responseToCache);
              }
              return networkResponse;
            }).catch(error => {
              console.error(`[ServiceWorker] Fallo al buscar en red (navigate): ${event.request.url}`, error);
              // Opcional: Devolver una página offline.html si la red falla y no está en caché
              // return caches.match('offline.html'); 
            });
          });
      })
    );
    return;
  }

  // Estrategia: Cache First, then Network for other assets (CSS, JS, Images from same origin)
  // Para otros recursos (CSS, JS, imágenes del mismo origen)
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request)
        .then(response => {
          // Si está en caché, devolverlo
          if (response) {
            console.log(`[ServiceWorker] Sirviendo desde caché: ${event.request.url}`);
            return response;
          }
          // Si no, ir a la red
          console.log(`[ServiceWorker] No en caché, buscando en red: ${event.request.url}`);
          return fetch(event.request).then(networkResponse => {
            // Cachear la respuesta de la red si es válida y del mismo origen o CORS permitida
            // No cachear respuestas opacas (type: 'opaque') de CDNs a menos que se manejen con cuidado,
            // ya que no se puede verificar su validez y pueden ocupar mucho espacio.
            if (networkResponse && networkResponse.ok && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
              const responseToCache = networkResponse.clone();
              cache.put(event.request, responseToCache);
            }
            return networkResponse;
          }).catch(error => {
            console.error(`[ServiceWorker] Fallo al buscar en red: ${event.request.url}`, error);
            // No se devuelve nada aquí, dejando que el navegador maneje el error de red.
          });
        });
    })
  );
});
