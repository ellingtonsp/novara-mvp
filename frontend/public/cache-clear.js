// Cache Clearing Script for Novara PWA
// Run this in your browser console to clear all caches

console.log('🔄 Novara Cache Clearing Script');

async function clearNovaraCache() {
  try {
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('📋 Found caches:', cacheNames);
      
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          console.log('🗑️ Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
      console.log('✅ All caches cleared successfully');
    }
    
    // Unregister service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('🔧 Found service workers:', registrations.length);
      
      await Promise.all(
        registrations.map(async (registration) => {
          console.log('🗑️ Unregistering service worker:', registration.scope);
          return registration.unregister();
        })
      );
      console.log('✅ All service workers unregistered');
    }
    
    // Clear IndexedDB
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases();
      console.log('🗄️ Found databases:', databases.length);
      
      for (const db of databases) {
        if (db.name && db.name.includes('Novara')) {
          console.log('🗑️ Deleting database:', db.name);
          indexedDB.deleteDatabase(db.name);
        }
      }
      console.log('✅ IndexedDB cleared');
    }
    
    console.log('🎉 Cache clearing complete! Reloading page...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
}

// Auto-run the function
clearNovaraCache();

// Also expose it globally for manual execution
window.clearNovaraCache = clearNovaraCache;
console.log('💡 You can also run: clearNovaraCache()'); 