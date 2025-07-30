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

// Environment detection with enhanced Vercel preview support
const getEnvironment = (): string => {
  // Enhanced debugging for environment detection
  console.log('🔍 ENVIRONMENT DETECTION DEBUG:', {
    VITE_ENV: import.meta.env.VITE_ENV,
    MODE: import.meta.env.MODE,
    VITE_VERCEL_ENV: import.meta.env.VITE_VERCEL_ENV,
    NODE_ENV: import.meta.env.NODE_ENV,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side'
  });

  // Check for explicit environment variable first
  if (import.meta.env.VITE_ENV) {
    console.log('🔧 Using explicit VITE_ENV:', import.meta.env.VITE_ENV);
    return import.meta.env.VITE_ENV.trim();
  }
  
  // PRIORITY 1: If MODE is production, always use production regardless of Vercel settings
  if (import.meta.env.MODE === 'production') {
    console.log('🔧 Environment Override: MODE is "production", using "production" regardless of VITE_VERCEL_ENV');
    return 'production';
  }
  
  // PRIORITY 2: Check if we're on the canonical production domain
  if (typeof window !== 'undefined' && window.location.hostname === 'novara-mvp.vercel.app') {
    console.log('🔧 Environment Override: On canonical production domain, using "production"');
    return 'production';
  }
  
  // Use Vercel's automatic environment detection if available
  if (import.meta.env.VITE_VERCEL_ENV) {
    // VITE_VERCEL_ENV can be 'production', 'preview', or 'development'
    // But Vercel sometimes incorrectly sets this to 'staging' for production deployments
    const vercelEnv = import.meta.env.VITE_VERCEL_ENV.trim();
    
    // If Vercel says 'staging' but we're on a production deployment, override it
    if (vercelEnv === 'staging' && import.meta.env.MODE === 'production') {
      console.log('🔧 Environment Override: Vercel says "staging" but MODE is "production", using "production"');
      return 'production';
    }
    
    console.log('🔧 Using Vercel environment:', vercelEnv);
    return vercelEnv;
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
    // If this is a production deployment (not a preview), treat it as production
    if (import.meta.env.VITE_VERCEL_ENV === 'production') {
      return 'production';
    }
    // For dynamic URLs that are production deployments, treat as production
    if (import.meta.env.VITE_VERCEL_ENV === 'production' || 
        (import.meta.env.VITE_VERCEL_ENV && !import.meta.env.VITE_VERCEL_ENV.includes('preview'))) {
      return 'production';
    }
    // Additional check: if MODE is production, treat as production regardless of VITE_VERCEL_ENV
    if (import.meta.env.MODE === 'production') {
      return 'production';
    }
    return 'preview';
  }
  
  // Default to production
  return 'production';
};

// API URL configuration with automatic preview handling
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
      return 'https://novara-staging.up.railway.app';
    case 'preview':
      // For Vercel preview deployments, use staging backend
      // This prevents API breakages on every deployment
      return 'https://novara-staging.up.railway.app';
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

// Enhanced logging for all environments (especially preview for debugging)
if (environmentConfig.debugMode || environmentConfig.isStaging || environmentConfig.isPreview || environmentConfig.isProduction) {
  console.log('🌍 Environment Configuration:', {
    environment: environmentConfig.environment,
    apiUrl: environmentConfig.apiUrl,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
    mode: import.meta.env.MODE,
    viteApiUrl: import.meta.env.VITE_API_URL,
    viteEnv: import.meta.env.VITE_ENV,
    viteVercelEnv: import.meta.env.VITE_VERCEL_ENV,
    viteVercelUrl: import.meta.env.VITE_VERCEL_URL,
    viteVercelBranchUrl: import.meta.env.VITE_VERCEL_BRANCH_URL,
    viteVercelGitCommitRef: import.meta.env.VITE_VERCEL_GIT_COMMIT_REF,
    timestamp: new Date().toISOString()
  });
  
  // Additional debugging for environment detection
  console.log('🔍 Environment Detection Debug:', {
    hasViteEnv: !!import.meta.env.VITE_ENV,
    hasVercelEnv: !!import.meta.env.VITE_VERCEL_ENV,
    vercelEnvValue: import.meta.env.VITE_VERCEL_ENV,
    mode: import.meta.env.MODE,
    hostnameIncludesVercel: typeof window !== 'undefined' ? window.location.hostname.includes('.vercel.app') : false,
    hostnameIncludesStaging: typeof window !== 'undefined' ? window.location.hostname.includes('staging') : false
  });
}

// Export commonly used values
export const API_BASE_URL = environmentConfig.apiUrl;
export const IS_DEVELOPMENT = environmentConfig.isDevelopment;
export const IS_STAGING = environmentConfig.isStaging;
export const IS_PREVIEW = environmentConfig.isPreview;
export const IS_PRODUCTION = environmentConfig.isProduction; 