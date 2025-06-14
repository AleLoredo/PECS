// main.js

// This version MUST be updated with each new deployment of assets or SW logic.
const PWA_VERSION = '1.0.0'; // Change this to '1.0.1', '1.0.2' etc. for new versions
document.getElementById('appVersion').textContent = PWA_VERSION;

const SERVICE_WORKER_FILE = 'service-worker.js';
const serviceWorkerUrl = `${SERVICE_WORKER_FILE}?v=${PWA_VERSION}`; // Versioning the SW file URL

let newWorker; // Variable to hold the new service worker

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    console.log('[MainJS] Page loaded. Attempting to register Service Worker.');
    navigator.serviceWorker.register(serviceWorkerUrl)
      .then(registration => {
        console.log(`[MainJS] Service Worker registered successfully. Scope: ${registration.scope}`);
        console.log(`[MainJS] Registered Service Worker URL: ${serviceWorkerUrl}`);

        if (registration.waiting) {
          console.log('[MainJS] A waiting service worker was found on registration:', registration.waiting);
          newWorker = registration.waiting;
          // If a SW is waiting, it means skipWaiting() might not have been called or completed during its install.
          // Or, this is an existing waiting SW from a previous attempt.
          // We can show the update button immediately.
          const updateButton = document.getElementById('updateButton');
          if (updateButton) {
            updateButton.textContent = 'New Version Ready. Click to Refresh';
            updateButton.style.display = 'block';
            updateButton.onclick = () => {
              console.log('[MainJS] Update button clicked for waiting SW. Reloading page.');
              // We expect the waiting SW to take over on reload if it's ready.
              // If it's truly stuck, it might need a postMessage to skipWaiting,
              // but our SW is designed to call skipWaiting itself.
              window.location.reload();
            };
          }
        }

        registration.addEventListener('updatefound', () => {
          console.log('[MainJS] Event: "updatefound" - New service worker version detected.');
          newWorker = registration.installing;
          console.log('[MainJS] New service worker is now installing:', newWorker);

          newWorker.addEventListener('statechange', () => {
            console.log(`[MainJS] Event: "statechange" - New service worker state: ${newWorker.state}`);
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[MainJS] New service worker is installed. Waiting to activate.');
                // At this point, the new SW should have called skipWaiting() and should activate soon.
                // The 'controllerchange' event will then handle the reload.
                const updateButton = document.getElementById('updateButton');
                if (updateButton) {
                  updateButton.textContent = 'New Version Installed. Refreshing Soon...';
                  updateButton.style.display = 'block';
                  // Optional: allow manual refresh if controllerchange is slow
                  updateButton.onclick = () => {
                    console.log('[MainJS] Update button clicked (new SW installed). Reloading page.');
                    window.location.reload();
                  };
                }
              } else {
                console.log('[MainJS] Service worker installed for the first time. Content is cached for offline use.');
                // On first install, SW takes control after next load or if clients.claim() is used and page reloaded.
              }
            } else if (newWorker.state === 'redundant') {
              console.error('[MainJS] New service worker became redundant. This is unexpected during normal updates.');
            }
          });
        });
      })
      .catch(error => {
        console.error('[MainJS] Service Worker registration failed:', error);
      });

    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) {
        console.log('[MainJS] Event: "controllerchange" - Already refreshing. Ignoring.');
        return;
      }
      console.log('[MainJS] Event: "controllerchange" - New service worker has taken control. Reloading page.');
      window.location.reload();
      refreshing = true;
    });
  });
} else {
  console.log('[MainJS] Service workers are not supported in this browser.');
}

// Example check for updates function (developer utility, not part of automatic update)
function checkPwaVersion() {
    console.log(`[MainJS] Current PWA_VERSION in main.js: ${PWA_VERSION}`);
}
// checkPwaVersion(); // Call this from browser console to verify PWA_VERSION
