// PWA Utility Functions

// Register service worker
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration);
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              showUpdateNotification();
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}

// Show update notification
function showUpdateNotification() {
  if (confirm('A new version of Novara is available. Would you like to update now?')) {
    // Send message to service worker to skip waiting
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SKIP_WAITING'
      });
    }
    
    // Reload the page
    window.location.reload();
  }
}

// Check if app is installed
export function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

// Request notification permission
export async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

// Send notification
export function sendNotification(title: string, options: NotificationOptions = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    return notification;
  }
  return null;
}

// Check online status
export function isOnline() {
  return navigator.onLine;
}

// Listen for online/offline events
export function onOnlineStatusChange(callback: (online: boolean) => void) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Store offline action
export async function storeOfflineAction(action: any) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'STORE_OFFLINE_ACTION',
      action
    });
  }
}

// Get app installation prompt
export function getInstallPrompt(): any {
  let deferredPrompt: any;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
  
  return deferredPrompt;
}

// Show install prompt
export async function showInstallPrompt() {
  const prompt = getInstallPrompt();
  if (prompt) {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    return outcome === 'accepted';
  }
  return false;
}

// Add to home screen
export function addToHomeScreen() {
  if (isAppInstalled()) {
    return Promise.resolve(true);
  }
  
  return showInstallPrompt();
}

// Get PWA capabilities
export function getPWACapabilities() {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    notifications: 'Notification' in window,
    pushManager: 'PushManager' in window,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    cache: 'caches' in window,
    indexedDB: 'indexedDB' in window,
    installed: isAppInstalled()
  };
}

// Initialize PWA features
export async function initializePWA() {
  const capabilities = getPWACapabilities();
  
  console.log('PWA Capabilities:', capabilities);
  
  // Register service worker
  if (capabilities.serviceWorker) {
    await registerServiceWorker();
  }
  
  // Request notification permission
  if (capabilities.notifications) {
    await requestNotificationPermission();
  }
  
  return capabilities;
}

// Send daily reminder notification
export function scheduleDailyReminder() {
  if ('Notification' in window && Notification.permission === 'granted') {
    // Check if it's time for daily reminder (e.g., 9 AM)
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(9, 0, 0, 0);
    
    if (now.getHours() === 9 && now.getMinutes() === 0) {
      sendNotification('Time for your daily check-in! 💕', {
        body: 'Take a moment to reflect on your mood and confidence today.',
        tag: 'daily-reminder',
        requireInteraction: false
      } as any);
    }
  }
}

// Handle notification actions
export function handleNotificationAction(action: string) {
  switch (action) {
    case 'checkin':
      window.location.href = '/checkin';
      break;
    case 'later':
      // Schedule reminder for later
      setTimeout(scheduleDailyReminder, 30 * 60 * 1000); // 30 minutes
      break;
    default:
      break;
  }
} 