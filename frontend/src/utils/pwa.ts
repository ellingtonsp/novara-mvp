// PWA Utility Functions
// Handles Progressive Web App features including enhanced cache management

// Cache version for forcing updates - should match service worker
const CACHE_VERSION = 'v2.0.0';
const CACHE_PREFIX = 'novara-';

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

// Clear all caches
export async function clearAllCaches() {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
      console.log('All caches cleared');
      
      // Force service worker update
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          registration.update();
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to clear caches:', error);
      return false;
    }
  }
  return false;
}

// Clear only outdated caches
export async function clearOutdatedCaches() {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      const outdatedCaches = cacheNames.filter(name => 
        name.startsWith(CACHE_PREFIX) && !name.includes(CACHE_VERSION)
      );
      
      await Promise.all(
        outdatedCaches.map(name => {
          console.log(`Deleting outdated cache: ${name}`);
          return caches.delete(name);
        })
      );
      
      if (outdatedCaches.length > 0) {
        console.log(`Cleared ${outdatedCaches.length} outdated caches`);
      }
      return true;
    } catch (error) {
      console.error('Failed to clear outdated caches:', error);
      return false;
    }
  }
  return false;
}

// Force service worker update
export async function forceServiceWorkerUpdate() {
  if ('serviceWorker' in navigator) {
    try {
      // Unregister current service worker
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      
      // Clear all caches
      await clearAllCaches();
      
      // Reload the page to register new service worker
      window.location.reload();
      return true;
    } catch (error) {
      console.error('Failed to force service worker update:', error);
      return false;
    }
  }
  return false;
}

// Check cache status with enhanced information
export async function checkCacheStatus(): Promise<CacheStatus[]> {
  if (!('caches' in window)) {
    return [];
  }

  try {
    const cacheNames = await caches.keys();
    const statuses: CacheStatus[] = [];

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      
      // Check if cache name includes current version
      const isCurrentVersion = name.includes(CACHE_VERSION);
      
      statuses.push({
        name,
        size: keys.length,
        lastUpdated: new Date().toISOString(),
        isCurrentVersion
      });
    }

    return statuses;
  } catch (error) {
    console.error('Failed to check cache status:', error);
    return [];
  }
}

// Show update notification - now handled by CacheUpdateNotification component
function showUpdateNotification() {
  // Broadcast update available event
  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel('sw-updates');
    channel.postMessage({
      type: 'UPDATE_AVAILABLE',
      version: CACHE_VERSION
    });
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

// Define PWA capabilities interface
export interface PWACapabilities {
  isInstallable: boolean;
  isOfflineCapable: boolean;
  hasNotificationSupport: boolean;
  hasBackgroundSync: boolean;
  hasCacheAPI: boolean;
}

// Define cache status interface
export interface CacheStatus {
  name: string;
  size: number;
  lastUpdated: string;
  isCurrentVersion: boolean;
}

// Get PWA capabilities
export function getPWACapabilities(): PWACapabilities {
  return {
    isInstallable: 'serviceWorker' in navigator && 'beforeinstallprompt' in window,
    isOfflineCapable: 'serviceWorker' in navigator,
    hasNotificationSupport: 'Notification' in window,
    hasBackgroundSync: 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype,
    hasCacheAPI: 'caches' in window
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