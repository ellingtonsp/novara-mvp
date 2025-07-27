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
  // Check if we already decided for this session
  const currentSessionId = getSessionId();
  const cacheKey = `novara_onboarding_path_${currentSessionId}`;
  
  if (typeof window !== 'undefined') {
    const cachedPath = sessionStorage.getItem(cacheKey);
    if (cachedPath && (cachedPath === 'control' || cachedPath === 'test')) {
      console.log('🧪 A/B Test: Using cached path =', cachedPath);
      return cachedPath as OnboardingPath;
    }
  }
  // Development testing: Check for forced path
  const forcedPath = import.meta.env.VITE_FORCE_ONBOARDING_PATH;
  console.log('🧪 A/B Test: Checking environment variables:', {
    VITE_FORCE_ONBOARDING_PATH: import.meta.env.VITE_FORCE_ONBOARDING_PATH,
    VITE_DEBUG_AB_TEST: import.meta.env.VITE_DEBUG_AB_TEST,
    VITE_AB_TEST_ENABLED: import.meta.env.VITE_AB_TEST_ENABLED,
    forcedPath
  });
  
  if (forcedPath && (forcedPath === 'control' || forcedPath === 'test')) {
    console.log('🧪 A/B Test: FORCED PATH =', forcedPath);
    // Cache the forced path decision
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(cacheKey, forcedPath);
    }
    return forcedPath;
  }

  // Check if A/B test is enabled
  if (import.meta.env.VITE_AB_TEST_ENABLED !== 'true') {
    console.log('🧪 A/B Test: DISABLED by env var, but forcing enabled for testing');
    // Temporarily force enabled for testing
    // if (typeof window !== 'undefined') {
    //   sessionStorage.setItem(cacheKey, 'control');
    // }
    // return 'control';
  }

  // Check if PostHog is available
  if (typeof window !== 'undefined' && (window as any).posthog) {
    const posthog = (window as any).posthog;
    
    // Check feature flag for fast onboarding
    const isFastLane = posthog.isFeatureEnabled('fast_onboarding_v1');
    
    console.log('🧪 A/B Test: PostHog fast_onboarding_v1 =', isFastLane);
    
    // Temporarily bypass PostHog for testing - use deterministic split instead
    console.log('🧪 A/B Test: Temporarily bypassing PostHog for testing');
    
    // Fall through to deterministic split
  }
  
  // Fallback: Deterministic 50/50 split based on session ID
  const sessionId = getSessionId();
  const sessionHash = sessionId.split('_').pop() || sessionId;
  const sessionBasedSplit = sessionHash.charCodeAt(0) % 2 === 0;
  const result = sessionBasedSplit ? 'test' : 'control';
  
  console.log('🧪 A/B Test: Using deterministic session-based split =', result, {
    sessionId: currentSessionId,
    sessionHash,
    sessionBasedSplit,
    sessionHashCharCode: sessionHash.charCodeAt(0)
  });
  
  // Cache the decision for this session
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(cacheKey, result);
    console.log('🧪 A/B Test: Cached path decision =', result);
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
 * Check if user needs to complete baseline panel or full onboarding
 * (test path users who haven't completed baseline questions OR control users without full onboarding)
 */
export const needsBaselineCompletion = (user: any, onboardingPath: OnboardingPath): boolean => {
  // Test path: needs baseline completion
  if (onboardingPath === 'test') {
    const needsBaseline = !user?.baseline_completed;
    
    console.log('🧪 ON-01: Test path baseline check:', {
      user: user?.email,
      onboardingPath,
      baseline_completed: user?.baseline_completed,
      needsBaseline
    });
    
    return needsBaseline;
  }
  
  // Control path: needs full onboarding (primary_need AND cycle_stage)
  if (onboardingPath === 'control') {
    const hasFullOnboarding = user?.primary_need && user?.cycle_stage;
    const needsOnboarding = !hasFullOnboarding;
    
    console.log('🧪 ON-01: Control path onboarding check:', {
      user: user?.email,
      onboardingPath,
      primary_need: user?.primary_need,
      cycle_stage: user?.cycle_stage,
      hasFullOnboarding,
      needsOnboarding
    });
    
    return needsOnboarding;
  }
  
  // Fallback: assume needs completion if unsure
  console.log('🧪 ON-01: Unknown path, defaulting to needs completion:', {
    user: user?.email,
    onboardingPath
  });
  
  return true;
};

/**
 * Clear onboarding path cache (useful for testing)
 */
export const clearOnboardingPathCache = () => {
  if (typeof window !== 'undefined') {
    const sessionId = getSessionId();
    const cacheKey = `novara_onboarding_path_${sessionId}`;
    sessionStorage.removeItem(cacheKey);
    console.log('🧪 A/B Test: Cleared onboarding path cache');
  }
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