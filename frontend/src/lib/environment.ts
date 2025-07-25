// Environment Configuration - Centralized environment management
// This file ensures all components use the correct environment-specific settings

export interface EnvironmentConfig {
  apiUrl: string;
  environment: string;
  isDevelopment: boolean;
  isStaging: boolean;
  isPreview: boolean;
  isProduction: boolean;
  debugMode: boolean;
}

// Environment detection
const getEnvironment = (): string => {
  // Check for explicit environment variable first
  if (import.meta.env.VITE_ENV) {
    return import.meta.env.VITE_ENV;
  }
  
  // Use Vercel's automatic environment detection if available
  if (import.meta.env.VITE_VERCEL_ENV) {
    // VITE_VERCEL_ENV can be 'production', 'preview', or 'development'
    return import.meta.env.VITE_VERCEL_ENV;
  }
  
  // Fall back to NODE_ENV
  if (import.meta.env.MODE === 'development') {
    return 'development';
  }
  
  // Check for staging indicators (for manual staging deployments)
  if (window.location.hostname.includes('staging') || 
      window.location.hostname.includes('git-staging')) {
    return 'staging';
  }
  
  // Check if we're on a vercel.app domain (likely a preview)
  if (typeof window !== 'undefined' && window.location.hostname.includes('.vercel.app')) {
    return 'preview';
  }
  
  // Default to production
  return 'production';
};

// API URL configuration
const getApiUrl = (): string => {
  // Use explicit API URL if provided
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  const env = getEnvironment();
  
  switch (env) {
    case 'development':
      return 'http://localhost:9002'; // Stable local backend port
    case 'staging':
      return 'https://novara-staging-staging.up.railway.app';
    case 'preview':
      // For Vercel preview deployments, use staging backend
      // You can enhance this to use dynamic Railway preview URLs if needed
      return 'https://novara-staging-staging.up.railway.app';
    case 'production':
    default:
      return 'https://novara-mvp-production.up.railway.app';
  }
};

// Create environment configuration
export const environmentConfig: EnvironmentConfig = {
  apiUrl: getApiUrl(),
  environment: getEnvironment(),
  isDevelopment: getEnvironment() === 'development',
  isStaging: getEnvironment() === 'staging',
  isPreview: getEnvironment() === 'preview',
  isProduction: getEnvironment() === 'production',
  debugMode: import.meta.env.VITE_DEBUG === 'true' || getEnvironment() === 'development'
};

// Log environment configuration (always log in staging for debugging)
if (environmentConfig.debugMode || environmentConfig.isStaging) {
  console.log('🌍 Environment Configuration:', {
    environment: environmentConfig.environment,
    apiUrl: environmentConfig.apiUrl,
    hostname: window.location.hostname,
    mode: import.meta.env.MODE,
    viteApiUrl: import.meta.env.VITE_API_URL,
    viteEnv: import.meta.env.VITE_ENV,
    timestamp: new Date().toISOString(), // Force redeploy // Force cache bust
    vercelEnv: 'updated-production' // Force redeploy with new env vars
  });
}

// Export commonly used values
export const API_BASE_URL = environmentConfig.apiUrl;
export const IS_DEVELOPMENT = environmentConfig.isDevelopment;
export const IS_STAGING = environmentConfig.isStaging;
export const IS_PRODUCTION = environmentConfig.isProduction; 