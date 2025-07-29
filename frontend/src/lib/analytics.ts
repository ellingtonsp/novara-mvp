// PostHog Analytics Service - AN-01 Event Tracking Instrumentation
// Refactored for Vercel best practices and improved environment handling
// Based on: https://posthog.com/docs/libraries/vercel

import posthog from 'posthog-js';
import { environmentConfig } from './environment';

// PostHog Configuration - Using region-specific host as per Vercel docs
const POSTHOG_HOST = 'https://us.i.posthog.com';

// Event names as defined in AN-01 and CM-01
export const ANALYTICS_EVENTS = {
  SIGNUP: 'signup',
  CHECKIN_SUBMITTED: 'checkin_submitted',
  INSIGHT_VIEWED: 'insight_viewed',
  SHARE_ACTION: 'share_action',
  SENTIMENT_SCORED: 'sentiment_scored' // CM-01: Sentiment analysis tracking
} as const;

// Event payload types
export interface SignupEvent {
  user_id: string;
  signup_method: string;
  referrer?: string;
  experiment_variants?: string[];
}

export interface CheckinSubmittedEvent {
  user_id: string;
  mood_score: number;
  symptom_flags?: string[];
  cycle_day?: number;
  time_to_complete_ms?: number;
  checkin_type?: 'quick' | 'comprehensive';
  medication_taken?: boolean;
}

export interface InsightViewedEvent {
  user_id: string;
  insight_id: string;
  insight_type: string;
  dwell_ms?: number;
  cta_clicked?: boolean;
}

export interface ShareActionEvent {
  user_id: string;
  share_surface: string;
  destination: string;
  content_id?: string;
}

export interface SentimentScoredEvent {
  user_id: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';  // Added 'mixed'
  confidence: number;
  mood_score: number;
  processing_time_ms: number;
  text_sources: string[];
  sentiment_scores: {
    positive: number;
    neutral: number;
    negative: number;
    compound: number;
  };
  critical_concerns?: string[];  // NEW: Track critical concerns detected
  confidence_factors?: {        // NEW: Track confidence factors that influenced sentiment
    medication?: number;
    financial?: number;
    overall?: number;
  };
}

export interface InsightFeedbackEvent {
  user_id: string;
  insight_id: string;           // Unique ID for the insight shown
  feedback_type: 'helpful' | 'not_helpful';
  feedback_text?: string;       // Optional constructive feedback
  insight_context: {
    sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
    copy_variant_used: string;
    critical_concerns?: string[];
    confidence_factors?: Record<string, number>;
  };
  timestamp: string;
}

// Vercel-specific environment detection
const isVercelEnvironment = (): boolean => {
  return !!(
    import.meta.env.VITE_VERCEL_ENV ||
    import.meta.env.VITE_VERCEL_URL ||
    import.meta.env.VITE_VERCEL_BRANCH_URL ||
    (typeof window !== 'undefined' && window.location.hostname.includes('.vercel.app'))
  );
};

// Enhanced PostHog configuration for Vercel
const getPostHogConfig = () => {
  const baseConfig = {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // We'll handle pageviews manually
    capture_pageleave: false, // Disable automatic page leave tracking
    disable_session_recording: true, // Disable session recording for privacy
    opt_out_capturing_by_default: false,
    respect_dnt: true, // Respect Do Not Track
    autocapture: false, // Disable automatic event capture
    disable_persistence: false,
    enable_recording_console_log: false,
  };

  // Vercel-specific optimizations
  if (isVercelEnvironment()) {
    const vercelHeaders: Record<string, string> = {
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    if (import.meta.env.VITE_VERCEL_ENV) {
      vercelHeaders['X-Vercel-Environment'] = import.meta.env.VITE_VERCEL_ENV;
    }
    
    return {
      ...baseConfig,
      // Vercel serverless optimizations for immediate event flushing
      batch_size: 1,              // Send events immediately, don't batch
      request_timeout: 10000,     // 10 second timeout for reliability
      // Optimize for Vercel's edge network
      disable_compression: false, // Enable compression for better performance
      xhr_headers: vercelHeaders,
      // Better error handling for Vercel's serverless environment
      loaded: (posthog: any) => {
        if (environmentConfig.debugMode) {
          console.log('PostHog initialized successfully on Vercel');
        }
        // Set user properties for Vercel environment
        posthog.people.set({
          vercel_environment: import.meta.env.VITE_VERCEL_ENV || 'unknown',
          vercel_url: import.meta.env.VITE_VERCEL_URL || 'unknown',
          deployment_type: 'vercel'
        });
      }
    };
  }

  // Development-specific configuration
  if (environmentConfig.isDevelopment) {
    return {
      ...baseConfig,
      disable_compression: true, // Disable compression in dev for debugging
      xhr_headers: {
        'X-Requested-With': 'XMLHttpRequest'
      },
      loaded: () => {
        console.log('PostHog enabled in development mode for testing');
      }
    };
  }

  return baseConfig;
};

// Initialize PostHog with Vercel-optimized configuration
export const initializeAnalytics = (): void => {
  console.log('🔍 ANALYTICS DEBUG: Starting PostHog initialization...');
  
  // Check if PostHog library is available
  console.log('🔍 ANALYTICS DEBUG: PostHog library check:', {
    posthogImport: typeof posthog,
    posthogObject: typeof posthog === 'object' ? Object.keys(posthog) : 'not an object',
    windowPosthog: typeof (window as any).posthog
  });
  
  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
  
  console.log('🔍 ANALYTICS DEBUG: API Key check:', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 4) : 'none'
  });
  
  if (!apiKey) {
    console.warn('❌ PostHog API key not found. Analytics will be disabled.');
    return;
  }

  // Enhanced environment logging
  console.log('🔍 ANALYTICS DEBUG: Environment check:', {
    environment: environmentConfig.environment,
    isVercel: isVercelEnvironment(),
    vercelEnv: import.meta.env.VITE_VERCEL_ENV,
    vercelUrl: import.meta.env.VITE_VERCEL_URL,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
    debugMode: environmentConfig.debugMode
  });

  try {
    console.log('🔍 ANALYTICS DEBUG: Getting PostHog config...');
    const config = getPostHogConfig();
    console.log('🔍 ANALYTICS DEBUG: PostHog config:', config);
    
    console.log('🔍 ANALYTICS DEBUG: Initializing PostHog...');
    console.log('🔍 ANALYTICS DEBUG: posthog.init function:', typeof posthog.init);
    
    if (typeof posthog.init !== 'function') {
      console.error('❌ PostHog init function not available!');
      return;
    }
    
    posthog.init(apiKey, config);
    
    console.log('🔍 ANALYTICS DEBUG: PostHog init completed successfully');
    
    // Force window attachment for debugging
    if (typeof window !== 'undefined') {
      (window as any).posthog = posthog;
    }
    
    // Verify initialization with multiple checks
    setTimeout(() => {
      console.log('🔍 ANALYTICS DEBUG: PostHog verification (1s):', {
        posthogObject: !!(window as any).posthog,
        distinctId: (window as any).posthog?.get_distinct_id(),
        config: (window as any).posthog?.config,
        posthogImportStillAvailable: typeof posthog
      });
    }, 1000);
    
    // Additional verification after 3 seconds
    setTimeout(() => {
      console.log('🔍 ANALYTICS DEBUG: PostHog verification (3s):', {
        posthogObject: !!(window as any).posthog,
        distinctId: (window as any).posthog?.get_distinct_id(),
        config: (window as any).posthog?.config,
        posthogImportStillAvailable: typeof posthog,
        hasCapture: typeof (window as any).posthog?.capture === 'function',
        hasIdentify: typeof (window as any).posthog?.identify === 'function'
      });
    }, 3000);
    
  } catch (error) {
    console.error('❌ Failed to initialize PostHog:', error);
  }
};

// Enhanced core tracking function with Vercel optimizations
export const track = (event: string, payload: Record<string, any>): void => {
  console.log('🎯 AN-01 DEBUG: track() called with event:', event, 'payload:', payload);
  
  // Add environment context with Vercel-specific data
  const enrichedPayload = {
    ...payload,
    environment: environmentConfig.environment,
    timestamp: new Date().toISOString(),
    // Vercel-specific properties
    ...(isVercelEnvironment() && {
      vercel_environment: import.meta.env.VITE_VERCEL_ENV || 'unknown',
      vercel_url: import.meta.env.VITE_VERCEL_URL || 'unknown',
      vercel_branch_url: import.meta.env.VITE_VERCEL_BRANCH_URL || 'unknown',
      vercel_git_commit_ref: import.meta.env.VITE_VERCEL_GIT_COMMIT_REF || 'unknown'
    })
  };

  // Always log in development mode for debugging
  if (environmentConfig.isDevelopment) {
    try {
      console.debug('📊 PH-DEV Event:', event, enrichedPayload);
    } catch (error) {
      console.error('Failed to log development event:', error);
    }
  }

  // Send to PostHog in all environments when API key is present
  // This allows testing in development mode and ensures Vercel preview deployments work
  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
  console.log('🎯 AN-01 DEBUG: API Key available:', !!apiKey);
  console.log('🎯 AN-01 DEBUG: Environment check:', {
    isProduction: environmentConfig.isProduction,
    isStaging: environmentConfig.isStaging,
    isPreview: environmentConfig.isPreview,
    isDevelopment: environmentConfig.isDevelopment
  });
  
  if (apiKey && (environmentConfig.isProduction || environmentConfig.isStaging || environmentConfig.isPreview || environmentConfig.isDevelopment)) {
    try {
      // Use window.posthog if available, fallback to imported posthog
      const posthogInstance = (window as any).posthog || posthog;
      
      console.log('🎯 AN-01 DEBUG: posthogInstance available:', !!posthogInstance);
      console.log('🎯 AN-01 DEBUG: posthogInstance.capture available:', !!posthogInstance?.capture);
      
      if (!posthogInstance) {
        console.warn('⚠️ PostHog not available for tracking:', event);
        return;
      }
      
      // Ensure we have a distinct_id for the event
      if (payload.user_id && !posthogInstance.get_distinct_id()) {
        console.log('🎯 AN-01 DEBUG: Identifying user:', payload.user_id);
        posthogInstance.identify(payload.user_id);
      }
      
      // Use standard capture for web environments
      // Note: captureImmediate is for server-side PostHog only
      console.log('🎯 AN-01 DEBUG: Calling posthogInstance.capture with:', event, enrichedPayload);
      posthogInstance.capture(event, enrichedPayload);
      
      console.log('✅ AN-01 DEBUG: Event sent to PostHog successfully');
      
      if (environmentConfig.debugMode) {
        console.log('📊 PostHog Event:', event, enrichedPayload);
      }
    } catch (error) {
      console.error('❌ AN-01 DEBUG: Failed to track event:', event, error);
    }
  } else {
    console.log('🎯 AN-01 DEBUG: Skipping PostHog tracking - conditions not met');
  }
};

// CM-01: Track insight feedback for continuous improvement
export const trackInsightFeedback = (payload: InsightFeedbackEvent): void => {
  if (!isAnalyticsEnabled()) {
    console.log('📊 Analytics disabled - would track insight_feedback:', payload);
    return;
  }

  try {
    console.log('📊 Tracking insight_feedback event:', payload);
    
    // Track with PostHog
    posthog.capture('insight_feedback', {
      user_id: payload.user_id,
      insight_id: payload.insight_id,
      feedback_type: payload.feedback_type,
      feedback_text: payload.feedback_text,
      sentiment: payload.insight_context.sentiment,
      copy_variant_used: payload.insight_context.copy_variant_used,
      critical_concerns: payload.insight_context.critical_concerns,
      confidence_factors: payload.insight_context.confidence_factors,
      timestamp: payload.timestamp,
      // Add metadata for analysis
      $set: {
        last_insight_feedback: payload.feedback_type,
        last_feedback_timestamp: payload.timestamp
      }
    });

    console.log('✅ insight_feedback event tracked successfully');
  } catch (error) {
    console.error('❌ Failed to track insight_feedback event:', error);
  }
};

// Event-specific tracking functions
export const trackSignup = (payload: SignupEvent): void => {
  track(ANALYTICS_EVENTS.SIGNUP, payload);
};

export const trackCheckinSubmitted = (payload: CheckinSubmittedEvent): void => {
  track(ANALYTICS_EVENTS.CHECKIN_SUBMITTED, payload);
};

export const trackInsightViewed = (payload: InsightViewedEvent): void => {
  track(ANALYTICS_EVENTS.INSIGHT_VIEWED, payload);
};

export const trackShareAction = (payload: ShareActionEvent): void => {
  track(ANALYTICS_EVENTS.SHARE_ACTION, payload);
};

export const trackSentimentScored = (payload: SentimentScoredEvent): void => {
  track(ANALYTICS_EVENTS.SENTIMENT_SCORED, payload);
};

// Enhanced user identification with Vercel context
export const identifyUser = (userId: string, userProperties?: Record<string, any>): void => {
  const enrichedProperties = {
    ...userProperties,
    // Add Vercel-specific user properties
    ...(isVercelEnvironment() && {
      vercel_environment: import.meta.env.VITE_VERCEL_ENV || 'unknown',
      deployment_type: 'vercel'
    })
  };

  if (environmentConfig.isProduction || environmentConfig.isStaging || environmentConfig.isPreview || environmentConfig.isDevelopment) {
    try {
      // Use window.posthog if available, fallback to imported posthog
      const posthogInstance = (window as any).posthog || posthog;
      
      if (!posthogInstance) {
        console.warn('⚠️ PostHog not available for user identification');
        return;
      }
      
      posthogInstance.identify(userId, enrichedProperties);
      
      if (environmentConfig.debugMode) {
        console.log('👤 PostHog Identify:', userId, enrichedProperties);
      }
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  } else {
    console.debug('👤 PH-DEV Identify:', userId, enrichedProperties);
  }
};

export const resetUser = (): void => {
  if (environmentConfig.isProduction || environmentConfig.isStaging || environmentConfig.isPreview) {
    try {
      // Use window.posthog if available, fallback to imported posthog
      const posthogInstance = (window as any).posthog || posthog;
      
      if (!posthogInstance) {
        console.warn('⚠️ PostHog not available for reset');
        return;
      }
      
      posthogInstance.reset();
      
      if (environmentConfig.debugMode) {
        console.log('🔄 PostHog Reset');
      }
    } catch (error) {
      console.error('Failed to reset PostHog:', error);
    }
  } else {
    console.debug('🔄 PH-DEV Reset');
  }
};

// Enhanced health check function
export const isAnalyticsEnabled = (): boolean => {
  return !!import.meta.env.VITE_POSTHOG_API_KEY;
};

// Vercel-specific utility functions
export const getVercelEnvironment = (): string => {
  return import.meta.env.VITE_VERCEL_ENV || 'unknown';
};

export const isVercelPreview = (): boolean => {
  return import.meta.env.VITE_VERCEL_ENV === 'preview';
};

// Export PostHog instance for advanced usage
export { posthog }; 