/**
 * Service Worker for Super Sky App
 * 
 * This service worker provides:
 * - Offline capabilities through caching
 * - Background sync for data updates
 * - Push notification support for weather alerts
 */

// Cache name with version for easy updates
const CACHE_NAME = 'super-sky-cache-v2';

// Assets to cache on install
const STATIC_ASSETS = [
  './',
  './index.html',
  './index.jsx',
  './styles/main.css',
  './components/App.jsx',
  './components/ComparisonView.jsx',
  './hooks/useWeather.js',
  './services/weatherService.js',
  './utils/cacheManager.js',
  './utils/helpers.js',
  './utils/transformers.js',
  './config/config.js',
  './types/weather.d.ts'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker...');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(error => {
        console.error('[Service Worker] Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker...');
  
  // Claim clients to ensure the service worker controls all clients immediately
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network with development-friendly caching
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip API requests (we handle these separately with our own caching)
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // For development: always fetch fresh for HTML, JS, and CSS files
  const url = new URL(event.request.url);
  const isDevelopmentAsset = url.pathname.endsWith('.html') ||
                            url.pathname.endsWith('.js') ||
                            url.pathname.endsWith('.css') ||
                            url.pathname.endsWith('.jsx');
  
  if (isDevelopmentAsset) {
    // Always fetch fresh during development
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Don't cache development assets
          return response;
        })
        .catch(error => {
          console.error('[Service Worker] Fetch failed:', error);
          // For HTML requests, return the cached offline page as fallback
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
          throw error;
        })
    );
    return;
  }
  
  // For other assets (images, icons, etc.), use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();
            
            // Cache the new response
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.error('[Service Worker] Fetch failed:', error);
            // For HTML requests, return the offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
            
            // Otherwise just propagate the error
            throw error;
          });
      })
  );
});

// Background sync for weather data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-weather-data') {
    console.log('[Service Worker] Syncing weather data...');
    event.waitUntil(syncWeatherData());
  }
});

// Function to sync weather data in the background
async function syncWeatherData() {
  try {
    // Get all clients
    const clients = await self.clients.matchAll();
    
    // Check if we have any clients to send messages to
    if (clients.length === 0) {
      return;
    }
    
    // Get the most recent ZIP code from localStorage
    const recentZipCodes = JSON.parse(localStorage.getItem('recentZipCodes') || '[]');
    
    if (recentZipCodes.length === 0) {
      return;
    }
    
    const zipCode = recentZipCodes[0];
    
    // Notify clients that we're syncing
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STARTED',
        zipCode: zipCode
      });
    });
    
    // Perform the sync (in a real app, this would fetch from the API)
    // For now, we'll just simulate a successful sync
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Notify clients that sync is complete
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        zipCode: zipCode,
        timestamp: Date.now()
      });
    });
    
  } catch (error) {
    console.error('[Service Worker] Background sync failed:', error);
  }
}

// Push notification event
self.addEventListener('push', event => {
  console.log('[Service Worker] Push notification received:', event);
  
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Weather Alert',
        body: event.data.text()
      };
    }
  }
  
  const title = data.title || 'Weather Alert';
  const options = {
    body: data.body || 'New weather information is available.',
    icon: './icon.png',
    badge: './badge.png',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();
  
  // Open the app and navigate to the specified URL
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Check if a window is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || '/');
        }
      })
  );
});

// Log any errors
self.addEventListener('error', event => {
  console.error('[Service Worker] Error:', event.message, event.filename, event.lineno);
});