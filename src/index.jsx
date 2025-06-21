import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

// Import CSS files
import './styles/design-system.css';
import './styles/animations.css';
import './styles/onboarding.css';
import './styles/help.css';
import './styles/skeleton.css';
import './styles/tooltip.css';
import './styles/main.css';
import './styles/responsive.css';

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./serviceWorker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Setup background sync if available
        if ('SyncManager' in window) {
          // Request sync registration when online
          navigator.serviceWorker.ready.then(registration => {
            // Register for background sync
            registration.periodicSync.register('sync-weather-data', {
              minInterval: 60 * 60 * 1000 // Once per hour
            }).catch(error => {
              console.log('Periodic Sync could not be registered:', error);
            });
          });
        }
        
        // Setup push notifications if available
        if ('PushManager' in window) {
          // We would request notification permission here in a real app
          console.log('Push notifications are supported');
        }
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
  
  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', event => {
    const data = event.data;
    
    if (data.type === 'SYNC_COMPLETED') {
      console.log('Background sync completed for ZIP code:', data.zipCode);
      // In a real app, we would update the UI here
    }
  });
}

// Get the root element
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

// Render the App component
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);