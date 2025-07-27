import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import * as Sentry from "@sentry/react";

// Initialize Sentry only if DSN is provided and valid
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn && sentryDsn !== 'https://your-sentry-dsn@sentry.io/project-id' && sentryDsn.startsWith('https://')) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 1.0,
  });
  console.log('Sentry initialized successfully');
} else {
  console.log('Sentry not initialized - no valid DSN provided');
}

// Wrap the app with Sentry only if initialized
const SentryApp = sentryDsn && sentryDsn !== 'https://your-sentry-dsn@sentry.io/project-id' && sentryDsn.startsWith('https://') 
  ? Sentry.withProfiler(App) 
  : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SentryApp />
    </AuthProvider>
  </StrictMode>,
)