import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import * as Sentry from "@sentry/react";

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});

// Wrap the app with Sentry
const SentryApp = Sentry.withProfiler(App);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SentryApp />
    </AuthProvider>
  </StrictMode>,
)