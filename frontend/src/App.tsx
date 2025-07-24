import { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import NovaraLanding from './components/NovaraLanding'
import { AnalyticsWrapper, initGA, getAnalyticsConfig } from './lib/analytics'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initializePWA } from './utils/pwa'
import './App.css'

function App() {
  // Initialize analytics on app load - Production deployment with GA4
  // Environment: VITE_GA_MEASUREMENT_ID should be G-QP9XJD6QFS
  // Triggering redeploy with environment variable
  const analyticsConfig = getAnalyticsConfig();
  if (analyticsConfig.shouldTrack && analyticsConfig.gaMeasurementId) {
    initGA(analyticsConfig.gaMeasurementId);
  }

  // Initialize PWA features
  useEffect(() => {
    initializePWA().then((capabilities) => {
      console.log('PWA initialized with capabilities:', capabilities);
    });
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