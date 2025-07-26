import { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import NovaraLanding from './components/NovaraLanding'
import { initializeAnalytics } from './lib/analytics'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initializePWA, checkCacheStatus, clearAllCaches } from './utils/pwa'
import { environmentConfig } from './lib/environment'
import './App.css'

function App() {
  // Initialize PostHog analytics on app load - AN-01 Event Tracking Instrumentation
  useEffect(() => {
    console.log('🚀 AN-01 DEBUG: App.tsx - About to initialize analytics');
    console.log('🚀 AN-01 DEBUG: Current environment:', environmentConfig.environment);
    console.log('🚀 AN-01 DEBUG: API Key present:', !!import.meta.env.VITE_POSTHOG_API_KEY);
    console.log('🚀 AN-01 DEBUG: API Key length:', import.meta.env.VITE_POSTHOG_API_KEY?.length || 0);
    console.log('🚀 AN-01 DEBUG: API Key prefix:', import.meta.env.VITE_POSTHOG_API_KEY?.substring(0, 4) || 'none');
    console.log('🚀 AN-01 DEBUG: PostHog Host:', import.meta.env.VITE_POSTHOG_HOST);
    console.log('🚀 AN-01 DEBUG: Hostname:', window.location.hostname);
    console.log('🚀 AN-01 DEBUG: All env vars:', {
      VITE_VERCEL_ENV: import.meta.env.VITE_VERCEL_ENV,
      VITE_POSTHOG_API_KEY: import.meta.env.VITE_POSTHOG_API_KEY ? 'present' : 'missing',
      VITE_POSTHOG_HOST: import.meta.env.VITE_POSTHOG_HOST,
      VITE_API_URL: import.meta.env.VITE_API_URL,
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE
    });
    
    try {
      initializeAnalytics();
      console.log('🚀 AN-01 DEBUG: Analytics initialization completed');
    } catch (error) {
      console.error('🚀 AN-01 DEBUG: Analytics initialization failed:', error);
    }
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