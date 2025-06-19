/**
 * Notification Manager
 * 
 * This file contains utilities for managing push notifications.
 * It implements a mock notification system for weather alerts.
 */

// Check if notifications are supported
const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

// Check if notification permission is granted
const hasNotificationPermission = () => {
  return Notification.permission === 'granted';
};

// Request notification permission
const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.log('Notifications are not supported in this browser');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Subscribe to push notifications
const subscribeToPushNotifications = async () => {
  if (!isNotificationSupported() || !hasNotificationPermission()) {
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Get the server's public key
    // In a real app, this would come from your notification server
    const serverPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
    
    // Convert the public key to the format expected by the browser
    const applicationServerKey = urlB64ToUint8Array(serverPublicKey);
    
    // Subscribe the user
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });
    
    console.log('User is subscribed to push notifications');
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
};

// Unsubscribe from push notifications
const unsubscribeFromPushNotifications = async () => {
  if (!isNotificationSupported()) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('User is unsubscribed from push notifications');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

// Send a mock weather alert notification
const sendMockWeatherAlert = async (zipCode, alertType = 'rain') => {
  if (!isNotificationSupported() || !hasNotificationPermission()) {
    console.log('Cannot send notification: not supported or permission not granted');
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Create alert message based on type
    let title, body, icon;
    
    switch (alertType) {
      case 'rain':
        title = 'Rain Alert';
        body = `Heavy rain expected in ${zipCode} in the next hour.`;
        icon = './icons/icon-192x192.png';
        break;
      case 'storm':
        title = 'Storm Warning';
        body = `Thunderstorm warning issued for ${zipCode}.`;
        icon = './icons/icon-192x192.png';
        break;
      case 'snow':
        title = 'Snow Alert';
        body = `Snowfall expected in ${zipCode} in the next 24 hours.`;
        icon = './icons/icon-192x192.png';
        break;
      case 'heat':
        title = 'Heat Advisory';
        body = `Extreme heat warning for ${zipCode}. Stay hydrated.`;
        icon = './icons/icon-192x192.png';
        break;
      default:
        title = 'Weather Alert';
        body = `Weather alert for ${zipCode}. Check forecast for details.`;
        icon = './icons/icon-192x192.png';
    }
    
    // Show notification
    await registration.showNotification(title, {
      body: body,
      icon: icon,
      badge: './icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        zipCode: zipCode,
        alertType: alertType,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: 'View Forecast'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    });
    
    console.log(`Mock ${alertType} alert sent for ${zipCode}`);
    return true;
  } catch (error) {
    console.error('Error sending mock notification:', error);
    return false;
  }
};

// Schedule a mock weather alert for testing
const scheduleMockWeatherAlert = (zipCode, delayInSeconds = 10, alertType = 'rain') => {
  console.log(`Scheduling mock ${alertType} alert for ${zipCode} in ${delayInSeconds} seconds`);
  
  setTimeout(() => {
    sendMockWeatherAlert(zipCode, alertType);
  }, delayInSeconds * 1000);
  
  return true;
};

// Helper function to convert base64 to Uint8Array
// (Required for applicationServerKey)
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Export the functions
window.notificationManager = {
  isNotificationSupported,
  hasNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  sendMockWeatherAlert,
  scheduleMockWeatherAlert
};