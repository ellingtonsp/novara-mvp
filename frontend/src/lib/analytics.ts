// PostHog Analytics Service - AN-01 Event Tracking Instrumentation
// Implements foundational product-analytics instrumentation for activation, retention, and feature usage funnels

import posthog from 'posthog-js';
import { environmentConfig } from './environment';

// PostHog Configuration
const POSTHOG_HOST = 'https://app.posthog.com';

// Event names as defined in AN-01
export const ANALYTICS_EVENTS = {
  SIGNUP: 'signup',
  CHECKIN_SUBMITTED: 'checkin_submitted',
  INSIGHT_VIEWED: 'insight_viewed',
  SHARE_ACTION: 'share_action'
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
  symptom_flags: string[];
  cycle_day?: number;
  time_to_complete_ms?: number;
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

// Initialize PostHog
export const initializeAnalytics = (): void => {
  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
  
  if (!apiKey) {
    console.warn('PostHog API key not found. Analytics will be disabled.');
    return;
  }

  // Only initialize in production and staging
  if (environmentConfig.isDevelopment) {
    console.log('PostHog disabled in development mode');
    return;
  }

  try {
    posthog.init(apiKey, {
      api_host: POSTHOG_HOST,
      loaded: () => {
        if (environmentConfig.debugMode) {
          console.log('PostHog initialized successfully');
        }
      },
      capture_pageview: false, // We'll handle pageviews manually
      capture_pageleave: false, // Disable automatic page leave tracking
      disable_session_recording: true, // Disable session recording for privacy
      opt_out_capturing_by_default: false,
      respect_dnt: true, // Respect Do Not Track
      autocapture: false, // Disable automatic event capture
      disable_persistence: false,
      enable_recording_console_log: false
    });
  } catch (error) {
    console.error('Failed to initialize PostHog:', error);
  }
};

// Core tracking function
export const track = (event: string, payload: Record<string, any>): void => {
  // Add environment context
  const enrichedPayload = {
    ...payload,
    environment: environmentConfig.environment,
    timestamp: new Date().toISOString()
  };

  if (environmentConfig.isProduction || environmentConfig.isStaging || environmentConfig.isPreview) {
    try {
      posthog.capture(event, enrichedPayload);
      
      if (environmentConfig.debugMode) {
        console.log('📊 PostHog Event:', event, enrichedPayload);
      }
    } catch (error) {
      console.error('Failed to track event:', event, error);
    }
  } else {
    // Development mode - log to console
    try {
      console.debug('📊 PH-DEV Event:', event, enrichedPayload);
    } catch (error) {
      console.error('Failed to log development event:', error);
    }
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

// Utility functions
export const identifyUser = (userId: string, userProperties?: Record<string, any>): void => {
  if (environmentConfig.isProduction || environmentConfig.isStaging || environmentConfig.isPreview) {
    try {
      posthog.identify(userId, userProperties);
      
      if (environmentConfig.debugMode) {
        console.log('👤 PostHog Identify:', userId, userProperties);
      }
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  } else {
    console.debug('👤 PH-DEV Identify:', userId, userProperties);
  }
};

export const resetUser = (): void => {
  if (environmentConfig.isProduction || environmentConfig.isStaging) {
    try {
      posthog.reset();
      
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

// Health check function
export const isAnalyticsEnabled = (): boolean => {
  return !environmentConfig.isDevelopment && !!import.meta.env.VITE_POSTHOG_API_KEY;
};

// Export PostHog instance for advanced usage
export { posthog }; 