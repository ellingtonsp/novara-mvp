import { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import NovaraLanding from './components/NovaraLanding'
import { initializeAnalytics } from './lib/analytics'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initializePWA, checkCacheStatus, clearAllCaches } from './utils/pwa'
import './App.css'

function App() {
  // Initialize PostHog analytics on app load - AN-01 Event Tracking Instrumentation
  useEffect(() => {
    initializeAnalytics();
  }, []);

  // Initialize PWA features and check cache status
  useEffect(() => {
    const initializeApp = async () => {
      const capabilities = await initializePWA();
      console.log('PWA initialized with capabilities:', capabilities);
      
      // Check cache status and clear outdated caches
      try {
        const cacheStatus = await checkCacheStatus();
        const hasOutdatedCache = cacheStatus.some(cache => !cache.isCurrentVersion);
        
        if (hasOutdatedCache) {
          console.log('Outdated cache detected, clearing...');
          await clearAllCaches();
          console.log('Cache cleared due to version mismatch');
        }
      } catch (error) {
        console.error('Failed to check cache status:', error);
      }
    };
    
    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NovaraLanding />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App