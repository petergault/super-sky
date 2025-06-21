/**
 * AppSettings Component
 * 
 * This component provides settings for PWA features:
 * - Notification preferences
 * - "Add to Home Screen" functionality
 * - Offline mode settings
 */

// Simulate React hooks
const { useState, useEffect, useCallback } = React;

/**
 * App Settings component
 * @returns {JSX.Element} - Rendered component
 */
const AppSettings = memo(({ zipCode }) => {
  // State for notification permission
  const [notificationPermission, setNotificationPermission] = useState('default');
  
  // State for PWA installation
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  // State for offline mode
  const [offlineMode, setOfflineMode] = useState(false);
  
  // State for notification preferences
  const [notificationPreferences, setNotificationPreferences] = useState({
    rain: true,
    storm: true,
    snow: true,
    heat: true
  });
  
  // Check notification permission on mount
  useEffect(() => {
    if (window.notificationManager && window.notificationManager.isNotificationSupported()) {
      setNotificationPermission(Notification.permission);
    }
    
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setCanInstall(false);
    }
    
    // Check if the app is in offline mode
    if (navigator.onLine === false) {
      setOfflineMode(true);
    }
    
    // Listen for online/offline events
    const handleOnline = () => setOfflineMode(false);
    const handleOffline = () => setOfflineMode(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to show the install button
      setCanInstall(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for appinstalled event
    const handleAppInstalled = () => {
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      // Update UI to hide the install button
      setCanInstall(false);
      console.log('PWA was installed');
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  
  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!window.notificationManager) return;
    
    const granted = await window.notificationManager.requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    
    if (granted) {
      // Subscribe to push notifications
      await window.notificationManager.subscribeToPushNotifications();
    }
  }, []);
  
  // Install the PWA
  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Clear the deferredPrompt
    setDeferredPrompt(null);
    
    // Update UI based on outcome
    if (outcome === 'accepted') {
      setCanInstall(false);
    }
  }, [deferredPrompt]);
  
  // Toggle notification preference
  const toggleNotificationPreference = useCallback((type) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  }, []);
  
  // Send a test notification
  const sendTestNotification = useCallback(() => {
    if (!window.notificationManager || !zipCode) return;
    
    // Find an enabled notification type
    const enabledTypes = Object.entries(notificationPreferences)
      .filter(([_, enabled]) => enabled)
      .map(([type]) => type);
    
    if (enabledTypes.length === 0) return;
    
    // Pick a random type from enabled types
    const randomType = enabledTypes[Math.floor(Math.random() * enabledTypes.length)];
    
    // Send the notification
    window.notificationManager.sendMockWeatherAlert(zipCode, randomType);
  }, [zipCode, notificationPreferences]);
  
  return (
    <div className="app-settings card" role="region" aria-labelledby="settings-heading">
      <h2 id="settings-heading">App Settings</h2>
      
      {/* Offline Mode Indicator */}
      {offlineMode && (
        <div className="offline-indicator" role="status" aria-live="polite">
          <p>
            <span className="offline-icon" aria-hidden="true">⚠️</span>
            You are currently in offline mode. Some features may be limited.
          </p>
        </div>
      )}
      
      {/* Install PWA Section */}
      {canInstall && (
        <div className="settings-section">
          <h3>Install App</h3>
          <p>Install Super Sky on your device for a better experience.</p>
          <button 
            className="btn" 
            onClick={installApp}
            aria-label="Install Super Sky app on your device"
          >
            Add to Home Screen
          </button>
        </div>
      )}
      
      {/* Notification Settings Section */}
      <div className="settings-section">
        <h3>Notification Settings</h3>
        
        {window.notificationManager && window.notificationManager.isNotificationSupported() ? (
          <>
            {notificationPermission === 'default' && (
              <div className="permission-request">
                <p>Enable notifications to receive weather alerts.</p>
                <button 
                  className="btn" 
                  onClick={requestPermission}
                  aria-label="Enable weather notifications"
                >
                  Enable Notifications
                </button>
              </div>
            )}
            
            {notificationPermission === 'granted' && (
              <div className="notification-preferences">
                <p>You will receive alerts for the following weather conditions:</p>
                <div className="preferences-list">
                  <label className="preference-item">
                    <input 
                      type="checkbox" 
                      checked={notificationPreferences.rain} 
                      onChange={() => toggleNotificationPreference('rain')}
                      aria-label="Receive rain alerts"
                    />
                    Rain Alerts
                  </label>
                  
                  <label className="preference-item">
                    <input 
                      type="checkbox" 
                      checked={notificationPreferences.storm} 
                      onChange={() => toggleNotificationPreference('storm')}
                      aria-label="Receive storm warnings"
                    />
                    Storm Warnings
                  </label>
                  
                  <label className="preference-item">
                    <input 
                      type="checkbox" 
                      checked={notificationPreferences.snow} 
                      onChange={() => toggleNotificationPreference('snow')}
                      aria-label="Receive snow alerts"
                    />
                    Snow Alerts
                  </label>
                  
                  <label className="preference-item">
                    <input 
                      type="checkbox" 
                      checked={notificationPreferences.heat} 
                      onChange={() => toggleNotificationPreference('heat')}
                      aria-label="Receive heat advisories"
                    />
                    Heat Advisories
                  </label>
                </div>
                
                {zipCode && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={sendTestNotification}
                    aria-label="Send a test notification"
                  >
                    Send Test Notification
                  </button>
                )}
              </div>
            )}
            
            {notificationPermission === 'denied' && (
              <div className="permission-denied">
                <p>
                  Notifications are blocked. Please update your browser settings to enable notifications.
                </p>
              </div>
            )}
          </>
        ) : (
          <p>Notifications are not supported in this browser.</p>
        )}
      </div>
      
      {/* Offline Settings Section */}
      <div className="settings-section">
        <h3>Offline Access</h3>
        <p>
          Super Sky can work offline with limited functionality.
          Your most recent weather data will be available even without an internet connection.
        </p>
        
        {/* Removed cache controls section */}
      </div>
    </div>
  );
});

// Set display name for debugging
AppSettings.displayName = 'AppSettings';

// Export the component
window.AppSettings = AppSettings;