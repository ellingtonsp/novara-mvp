// ON-01: A/B Test Utilities for Onboarding Experiment
// Fast Lane vs Control onboarding paths

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
  // Development testing: Check for forced path first
  const forcedPath = import.meta.env.VITE_FORCE_ONBOARDING_PATH;
  if (forcedPath && (forcedPath === 'control' || forcedPath === 'test')) {
    console.log('🧪 A/B Test: FORCED PATH =', forcedPath);
    // Don't cache forced paths in development for easier testing
    if (import.meta.env.NODE_ENV === 'development') {
      console.log('🧪 A/B Test: Development mode - not caching forced path');
      return forcedPath;
    }
    // Cache in production
    if (typeof window !== 'undefined') {
      const currentSessionId = getSessionId();
      const cacheKey = `novara_onboarding_path_${currentSessionId}`;
      sessionStorage.setItem(cacheKey, forcedPath);
    }
    return forcedPath;
  }

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



  // Check if PostHog is available and feature flag is enabled
  if (typeof window !== 'undefined' && (window as any).posthog) {
    const posthog = (window as any).posthog;
    const isFastLane = posthog.isFeatureEnabled('fast_onboarding_v1');
    
    console.log('🧪 A/B Test: PostHog fast_onboarding_v1 =', isFastLane);
    
    const result = isFastLane ? 'test' : 'control';
    
    // Cache the decision for this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(cacheKey, result);
      console.log('🧪 A/B Test: Cached PostHog path decision =', result);
    }
    
    return result;
  }
  
  // Fallback: Deterministic 50/50 split based on session ID
  let sessionId = getSessionId();
  
  // In development, use truly random session IDs for better testing
  if (import.meta.env.NODE_ENV === 'development' && !import.meta.env.VITE_FORCE_ONBOARDING_PATH) {
    sessionId = generateRandomSessionId();
    console.log('🧪 A/B Test: Development mode - using random session ID for testing');
  }
  
  const sessionHash = sessionId.split('_').pop() || sessionId;
  const sessionBasedSplit = sessionHash.charCodeAt(0) % 2 === 0;
  const result = sessionBasedSplit ? 'test' : 'control';
  
  console.log('🧪 A/B Test: Using session-based split =', result, {
    sessionId: sessionId.substring(0, 30) + '...',
    sessionHash,
    sessionBasedSplit,
    sessionHashCharCode: sessionHash.charCodeAt(0),
    isDevelopment: import.meta.env.NODE_ENV === 'development'
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
 * Development-only: Generate truly random session ID for testing
 */
export const generateRandomSessionId = (): string => {
  // Use more entropy for development testing
  const timestamp = Date.now();
  const random1 = Math.random().toString(36).substr(2, 9);
  const random2 = Math.random().toString(36).substr(2, 9);
  const random3 = Math.random().toString(36).substr(2, 9);
  
  return `test_session_${timestamp}_${random1}_${random2}_${random3}`;
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
 * Development-only: Force fresh path assignment for testing
 */
export const forceFreshPath = (): OnboardingPath => {
  if (import.meta.env.NODE_ENV === 'development') {
    clearOnboardingPathCache();
    const path = getOnboardingPath();
    console.log('🧪 A/B Test: Forced fresh path =', path);
    return path;
  }
  return getOnboardingPath();
};

/**
 * Development-only: Clear all A/B test storage for testing
 */
export const clearAllABTestStorage = () => {
  if (typeof window !== 'undefined' && import.meta.env.NODE_ENV === 'development') {
    // Clear session ID
    sessionStorage.removeItem('novara_onboarding_session_id');
    
    // Clear all onboarding path caches
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('novara_onboarding_path_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    console.log('🧪 A/B Test: Cleared all A/B test storage for testing');
    console.log('🧪 A/B Test: Removed keys:', keysToRemove);
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

// Development-only: Expose functions to window for testing
if (typeof window !== 'undefined' && import.meta.env.NODE_ENV === 'development') {
  (window as any).clearAllABTestStorage = clearAllABTestStorage;
  (window as any).forceFreshPath = forceFreshPath;
  (window as any).clearOnboardingPathCache = clearOnboardingPathCache;
  
  console.log('🧪 A/B Test: Development functions available on window:');
  console.log('  - window.clearAllABTestStorage()');
  console.log('  - window.forceFreshPath()');
  console.log('  - window.clearOnboardingPathCache()');
} 