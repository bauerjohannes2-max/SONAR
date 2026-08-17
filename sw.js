/**
 * SONAR: The Echo Chamber
 * Service Worker with Offline Cache-First Strategy for Instant Load Times
 */

const CACHE_NAME = 'sonar-cache-v1.9.3';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './version.json',
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
  './src/engine/SpriteManager.js',
  './src/engine/PostProcessing.js',
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
  './src/ui/TouchLayoutEditor.js',
  './src/ui/TutorialModal.js',
  './src/ui/OnboardingModal.js',
  './src/ui/StoryIntro.js',
  './src/ui/ProfileModal.js',
  './src/ui/LeaderboardModal.js',
  './src/services/FirebaseService.js',
  './src/services/StorageManager.js',
  './src/services/LeaderboardService.js',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/sprites/drone_sheet.png',
  './assets/sprites/hunter_sheet.png',
  './assets/sprites/stalker_sheet.png',
  './assets/sprites/core_crystal.png',
  './assets/sprites/tileset_walls.png',
  './assets/sprites/portal_exit.png',
  './assets/audio/sonar_ping.mp3',
  './assets/audio/crystal_pickup.mp3',
  './assets/audio/death_explosion.mp3',
  './assets/audio/enemy_alert.mp3',
  './assets/audio/portal_open.mp3',
  './assets/audio/ambient_drone.mp3',
  './assets/audio/bg_music.mp3'
];

// 1. Install: Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching offline game assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Activate: Purge obsolete previous caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Deleting obsolete cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch: Cache-First for local assets, Network-First for external APIs & version.json
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-First for version.json and external network calls
  if (url.origin !== self.location.origin || url.pathname.endsWith('version.json')) {
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
