import { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import NovaraLanding from './components/NovaraLanding'
import { AnalyticsWrapper, initGA, getAnalyticsConfig } from './lib/analytics'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initializePWA, checkCacheStatus, clearAllCaches } from './utils/pwa'
import './App.css'

function App() {
  // Initialize analytics on app load - Production deployment with GA4
  // Environment: VITE_GA_MEASUREMENT_ID should be G-QP9XJD6QFS
  // Triggering redeploy with environment variable
  const analyticsConfig = getAnalyticsConfig();
  if (analyticsConfig.shouldTrack && analyticsConfig.gaMeasurementId) {
    initGA(analyticsConfig.gaMeasurementId);
  }

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
        <AnalyticsWrapper />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App