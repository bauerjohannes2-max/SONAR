/**
 * SONAR: The Echo Chamber
 * Service Worker with Offline Cache-First Strategy for Instant Load Times
 */

const CACHE_NAME = 'sonar-echo-v1.5.0';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './styles/main.css',
  './src/main.js',
  './src/config.js',
  './src/engine/AudioEngine.js',
  './src/engine/WaveSystem.js',
  './src/engine/CanvasRenderer.js',
  './src/engine/InputHandler.js',
  './src/engine/TouchControls.js',
  './src/engine/DisplayManager.js',
  './src/engine/ParticleEngine.js',
  './src/world/GridMap.js',
  './src/world/levels.js',
  './src/world/EndlessMode.js',
  './src/entities/Player.js',
  './src/entities/Hunter.js',
  './src/entities/Stalker.js',
  './src/entities/Resonator.js',
  './src/entities/Decoy.js',
  './src/entities/Pickups.js',
  './src/ui/HUD.js',
  './src/ui/MenuSystem.js',
  './src/ui/Settings.js',
  './src/ui/TutorialModal.js',
  './src/ui/OnboardingModal.js',
  './src/ui/ProfileModal.js',
  './src/ui/LeaderboardModal.js',
  './src/services/FirebaseService.js',
  './src/services/StorageManager.js',
  './src/services/LeaderboardService.js',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

// 1. Install: Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching offline game assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate: Clear legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing deprecated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch: Cache-First for local assets, Network-First for external APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // External network calls (Google Fonts, Firestore CDN, Firebase APIs)
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Local game files: Cache-first with background network revalidation
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache for next launch
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
