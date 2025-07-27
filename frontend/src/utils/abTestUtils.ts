// ON-01: A/B Test Utilities for Onboarding Experiment
// Fast Lane vs Control onboarding paths with PostHog feature flags

export type OnboardingPath = 'control' | 'test';

export interface OnboardingContext {
  path: OnboardingPath;
  sessionId: string;
  startTime: number;
  userId?: string;
}

/**
 * Determine which onboarding path to show based on PostHog feature flag
 * Returns 'test' for Fast Lane, 'control' for standard onboarding
 */
export const getOnboardingPath = (): OnboardingPath => {
  // Development testing: Check for forced path
  const forcedPath = import.meta.env.VITE_FORCE_ONBOARDING_PATH;
  if (forcedPath && (forcedPath === 'control' || forcedPath === 'test')) {
    if (import.meta.env.VITE_DEBUG_AB_TEST === 'true') {
      console.log('🧪 A/B Test: FORCED PATH =', forcedPath);
    }
    return forcedPath;
  }

  // Check if A/B test is enabled
  if (import.meta.env.VITE_AB_TEST_ENABLED !== 'true') {
    if (import.meta.env.VITE_DEBUG_AB_TEST === 'true') {
      console.log('🧪 A/B Test: DISABLED, defaulting to control');
    }
    return 'control';
  }

  // Check if PostHog is available
  if (typeof window !== 'undefined' && (window as any).posthog) {
    const posthog = (window as any).posthog;
    
    // Check feature flag for fast onboarding
    const isFastLane = posthog.isFeatureEnabled('fast_onboarding_v1');
    
    if (import.meta.env.VITE_DEBUG_AB_TEST === 'true') {
      console.log('🧪 A/B Test: PostHog fast_onboarding_v1 =', isFastLane);
    }
    
    return isFastLane ? 'test' : 'control';
  }
  
  // Fallback: 50/50 split based on session
  const sessionBasedSplit = Math.random() < 0.5;
  const result = sessionBasedSplit ? 'test' : 'control';
  
  if (import.meta.env.VITE_DEBUG_AB_TEST === 'true') {
    console.log('🧪 A/B Test: PostHog not available, using session-based split =', result);
  }
  
  return result;
};

/**
 * Track onboarding path selection event
 */
export const trackOnboardingPathSelected = (path: OnboardingPath, context: Partial<OnboardingContext> = {}) => {
  const eventProperties = {
    path,
    session_id: context.sessionId || generateSessionId(),
    timestamp: Date.now(),
    environment: import.meta.env.NODE_ENV || 'development'
  };
  
  // Use existing AN-01 tracking infrastructure
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture('onboarding_path_selected', eventProperties);
  } else {
    // Fallback to console logging in development
    console.log('[Analytics] onboarding_path_selected:', eventProperties);
  }
};

/**
 * Track onboarding completion event
 */
export const trackOnboardingCompleted = (context: OnboardingContext & { completion_ms: number }) => {
  const eventProperties = {
    path: context.path,
    completion_ms: context.completion_ms,
    session_id: context.sessionId,
    user_id: context.userId,
    timestamp: Date.now(),
    environment: import.meta.env.NODE_ENV || 'development'
  };
  
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture('onboarding_completed', eventProperties);
  } else {
    console.log('[Analytics] onboarding_completed:', eventProperties);
  }
};

/**
 * Track baseline panel completion (test path only)
 */
export const trackBaselineCompleted = (context: { completion_ms: number; user_id: string; session_id: string }) => {
  const eventProperties = {
    completion_ms: context.completion_ms,
    user_id: context.user_id,
    session_id: context.session_id,
    timestamp: Date.now(),
    environment: import.meta.env.NODE_ENV || 'development'
  };
  
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture('baseline_completed', eventProperties);
  } else {
    console.log('[Analytics] baseline_completed:', eventProperties);
  }
};

/**
 * Generate a unique session ID
 */
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get or create session ID from sessionStorage
 */
export const getSessionId = (): string => {
  const key = 'novara_onboarding_session_id';
  
  if (typeof window !== 'undefined') {
    let sessionId = sessionStorage.getItem(key);
    
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem(key, sessionId);
    }
    
    return sessionId;
  }
  
  return generateSessionId();
};

/**
 * Check if user needs to complete baseline panel
 * (test path users who haven't completed baseline questions)
 */
export const needsBaselineCompletion = (user: any, onboardingPath: OnboardingPath): boolean => {
  return onboardingPath === 'test' && !user?.baselineCompleted;
};

/**
 * Safe tracking wrapper to prevent errors from blocking user experience
 */
export const safeTrack = (trackingFunction: () => void) => {
  try {
    trackingFunction();
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
    // Don't block user flow
  }
}; 