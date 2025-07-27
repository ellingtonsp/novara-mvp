/**
 * ON-01: Speed-Tapper Detection Utilities
 * 
 * Detects when users are rapidly interacting with onboarding forms
 * and triggers a fast-path onboarding experience.
 */

export interface TapEvent {
  timestamp: number;
  eventType: 'focus' | 'click' | 'change' | 'blur';
  step: number;
  sessionId: string;
}

export interface SpeedTapConfig {
  timeWindowMs: number;      // 10000ms (10 seconds)
  tapThreshold: number;      // 3 taps
  maxStep: number;          // 3 (before confidence sliders)
  rollingWindow: boolean;   // true
}

export interface OnboardingContext {
  path: 'fast' | 'standard';
  triggerReason: 'speed_tap' | 'manual' | 'default' | 'fallback';
  completionMs?: number;
  stepsCompleted?: number;
  tapCount?: number;
  timeWindowMs?: number;
}

const DEFAULT_CONFIG: SpeedTapConfig = {
  timeWindowMs: 10000,
  tapThreshold: 3,
  maxStep: 3,
  rollingWindow: true
};

const SESSION_KEYS = {
  TAP_HISTORY: 'novara_tap_history',
  ONBOARDING_STATE: 'novara_onboarding_state',
  SESSION_ID: 'novara_session_id',
  SPEED_TAP_CONFIG: 'novara_speed_tap_config'
} as const;

export class SpeedTapDetector {
  private tapHistory: TapEvent[] = [];
  private config: SpeedTapConfig;
  
  constructor(config: Partial<SpeedTapConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadTapHistory();
  }
  
  /**
   * Record a tap event and check for speed-tap detection
   */
  recordTap(eventType: TapEvent['eventType'], step: number): boolean {
    const tapEvent: TapEvent = {
      timestamp: Date.now(),
      eventType,
      step,
      sessionId: this.getSessionId()
    };
    
    this.tapHistory.push(tapEvent);
    this.cleanupOldTaps();
    this.saveTapHistory();
    
    return this.checkSpeedTapDetection();
  }
  
  /**
   * Check if speed-tap detection should be triggered
   */
  private checkSpeedTapDetection(): boolean {
    // Only detect before reaching max step
    if (this.getCurrentStep() >= this.config.maxStep) {
      return false;
    }
    
    // Check if we have enough taps in the time window
    return this.tapHistory.length >= this.config.tapThreshold;
  }
  
  /**
   * Clean up old tap events outside the time window
   */
  private cleanupOldTaps(): void {
    const cutoffTime = Date.now() - this.config.timeWindowMs;
    this.tapHistory = this.tapHistory.filter(tap => tap.timestamp > cutoffTime);
  }
  
  /**
   * Get the current step from tap history
   */
  private getCurrentStep(): number {
    return Math.max(...this.tapHistory.map(tap => tap.step), 1);
  }
  
  /**
   * Get or create a session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem(SESSION_KEYS.SESSION_ID);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(SESSION_KEYS.SESSION_ID, sessionId);
    }
    return sessionId;
  }
  
  /**
   * Load tap history from session storage
   */
  private loadTapHistory(): void {
    try {
      const stored = sessionStorage.getItem(SESSION_KEYS.TAP_HISTORY);
      if (stored) {
        this.tapHistory = JSON.parse(stored);
        // Clean up old taps on load
        this.cleanupOldTaps();
      }
    } catch (error) {
      console.warn('Failed to load tap history:', error);
      this.tapHistory = [];
    }
  }
  
  /**
   * Save tap history to session storage
   */
  private saveTapHistory(): void {
    try {
      sessionStorage.setItem(SESSION_KEYS.TAP_HISTORY, JSON.stringify(this.tapHistory));
    } catch (error) {
      console.warn('Failed to save tap history:', error);
    }
  }
  
  /**
   * Get current tap count
   */
  getTapCount(): number {
    return this.tapHistory.length;
  }
  
  /**
   * Get time window in milliseconds
   */
  getTimeWindowMs(): number {
    return this.config.timeWindowMs;
  }
  
  /**
   * Clear tap history (useful for testing)
   */
  clearHistory(): void {
    this.tapHistory = [];
    sessionStorage.removeItem(SESSION_KEYS.TAP_HISTORY);
  }
}

/**
 * Enhanced tracking function for ON-01 analytics
 */
export const trackOnboardingEvent = (eventName: string, properties: any) => {
  const baseProperties = {
    environment: import.meta.env.NODE_ENV || 'development',
    timestamp: Date.now(),
    session_id: sessionStorage.getItem(SESSION_KEYS.SESSION_ID) || 'unknown'
  };
  
  const enhancedProperties = {
    ...baseProperties,
    ...properties
  };
  
  // Use existing AN-01 tracking infrastructure
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture(eventName, enhancedProperties);
  } else {
    // Fallback to console logging in development
    console.log(`[Analytics] ${eventName}:`, enhancedProperties);
  }
};

/**
 * Track onboarding path selection
 */
export const trackPathSelection = (path: 'fast' | 'standard', context: Partial<OnboardingContext>) => {
  trackOnboardingEvent('onboarding_path_selected', {
    path,
    trigger_reason: context.triggerReason || 'default',
    tap_count: context.tapCount || 0,
    time_window_ms: context.timeWindowMs || 10000,
    detection_step: context.stepsCompleted || 1,
    user_agent: navigator.userAgent,
    screen_resolution: `${screen.width}x${screen.height}`
  });
};

/**
 * Track onboarding completion
 */
export const trackOnboardingCompletion = (completionData: {
  path: 'fast' | 'standard';
  completionMs: number;
  stepsCompleted: number;
  totalSteps: number;
  fieldsCompleted: string[];
}) => {
  trackOnboardingEvent('onboarding_completed', {
    path: completionData.path,
    completion_ms: completionData.completionMs,
    steps_completed: completionData.stepsCompleted,
    total_steps: completionData.totalSteps,
    fields_completed: completionData.fieldsCompleted
  });
};

/**
 * Check if speed-tap detection is enabled via feature flag
 */
export const isSpeedTapDetectionEnabled = (): boolean => {
  const enabled = import.meta.env.VITE_SPEED_TAP_ENABLED === 'true' ||
                 localStorage.getItem('speed_tap_detection_enabled') === 'true';
  
  console.log('🎯 Speed-tap detection check:', {
    envEnabled: import.meta.env.VITE_SPEED_TAP_ENABLED,
    localStorageEnabled: localStorage.getItem('speed_tap_detection_enabled'),
    finalEnabled: enabled
  });
  
  return enabled;
};

/**
 * Get speed-tap configuration from environment
 */
export const getSpeedTapConfig = (): SpeedTapConfig => {
  try {
    const configString = import.meta.env.VITE_SPEED_TAP_CONFIG;
    if (configString) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(configString) };
    }
  } catch (error) {
    console.warn('Failed to parse speed-tap config:', error);
  }
  
  return DEFAULT_CONFIG;
};

/**
 * Graceful fallback if detection fails
 */
export const handleDetectionFailure = (): OnboardingContext => {
  console.warn('Speed-tap detection failed, falling back to standard path');
  return {
    path: 'standard',
    triggerReason: 'fallback'
  };
};

/**
 * Safe tracking wrapper to prevent errors from blocking user experience
 */
export const safeTrack = (eventName: string, properties: any) => {
  try {
    trackOnboardingEvent(eventName, properties);
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
    // Don't block user flow
  }
}; 