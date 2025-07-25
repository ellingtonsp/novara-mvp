/**
 * AN-01 Event Tracking Unit Tests
 * 
 * Tests for all four core events: signup, checkin_submitted, insight_viewed, share_action
 * Covers success + failure paths with ≥90% branch coverage requirement
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ANALYTICS_EVENTS,
  track,
  trackSignup,
  trackCheckinSubmitted,
  trackInsightViewed,
  trackShareAction,
  initializeAnalytics,
  identifyUser,
  resetUser,
  isAnalyticsEnabled,
  type SignupEvent,
  type CheckinSubmittedEvent,
  type InsightViewedEvent,
  type ShareActionEvent
} from './analytics';

// Mock PostHog
const mockPostHog = {
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  get_distinct_id: vi.fn(() => 'test-user-id'),
  people: {
    set: vi.fn()
  }
};

// Mock environment variables
vi.mock('./environment', () => ({
  environmentConfig: {
    environment: 'test',
    isDevelopment: true,
    isProduction: false,
    isStaging: false,
    isPreview: false,
    debugMode: true,
    apiUrl: 'http://localhost:9002'
  }
}));

// Mock Vite environment variables
vi.stubEnv('VITE_POSTHOG_API_KEY', 'test-api-key');
vi.stubEnv('VITE_POSTHOG_HOST', 'https://us.i.posthog.com');
vi.stubEnv('VITE_VERCEL_ENV', 'test');

// Mock window.posthog
Object.defineProperty(window, 'posthog', {
  value: mockPostHog,
  writable: true
});

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {})
};

describe('AN-01 Event Tracking - Core Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.posthog
    (window as any).posthog = mockPostHog;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ANALYTICS_EVENTS Constants', () => {
    it('should export correct event names', () => {
      expect(ANALYTICS_EVENTS.SIGNUP).toBe('signup');
      expect(ANALYTICS_EVENTS.CHECKIN_SUBMITTED).toBe('checkin_submitted');
      expect(ANALYTICS_EVENTS.INSIGHT_VIEWED).toBe('insight_viewed');
      expect(ANALYTICS_EVENTS.SHARE_ACTION).toBe('share_action');
    });
  });

  describe('track() - Core Tracking Function', () => {
    it('should track events successfully with enriched payload', () => {
      const eventName = 'test_event';
      const payload = { user_id: 'test-user', test: true };

      track(eventName, payload);

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        eventName,
        expect.objectContaining({
          user_id: 'test-user',
          test: true,
          environment: 'test',
          timestamp: expect.any(String),
          vercel_environment: 'test'
        })
      );
    });

    it('should handle missing PostHog gracefully', () => {
      (window as any).posthog = undefined;
      const eventName = 'test_event';
      const payload = { user_id: 'test-user' };

      expect(() => track(eventName, payload)).not.toThrow();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '⚠️ PostHog not available for tracking:',
        eventName
      );
    });

    it('should handle PostHog capture errors gracefully', () => {
      mockPostHog.capture.mockImplementation(() => {
        throw new Error('PostHog error');
      });

      const eventName = 'test_event';
      const payload = { user_id: 'test-user' };

      expect(() => track(eventName, payload)).not.toThrow();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ AN-01 DEBUG: Failed to track event:',
        eventName,
        expect.any(Error)
      );
    });

    it('should identify user before tracking if user_id provided', () => {
      const eventName = 'test_event';
      const payload = { user_id: 'test-user' };

      track(eventName, payload);

      expect(mockPostHog.identify).toHaveBeenCalledWith('test-user');
    });

    it('should not identify user if already identified', () => {
      mockPostHog.get_distinct_id.mockReturnValue('test-user');
      
      const eventName = 'test_event';
      const payload = { user_id: 'test-user' };

      track(eventName, payload);

      expect(mockPostHog.identify).not.toHaveBeenCalled();
    });

    it('should handle user identification errors gracefully', () => {
      mockPostHog.identify.mockImplementation(() => {
        throw new Error('Identification error');
      });

      const eventName = 'test_event';
      const payload = { user_id: 'test-user' };

      expect(() => track(eventName, payload)).not.toThrow();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ AN-01 DEBUG: User identification failed:',
        expect.any(Error)
      );
    });

    it('should skip tracking when API key is missing', () => {
      vi.stubEnv('VITE_POSTHOG_API_KEY', '');
      
      const eventName = 'test_event';
      const payload = { user_id: 'test-user' };

      track(eventName, payload);

      expect(mockPostHog.capture).not.toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '🎯 AN-01 DEBUG: Skipping PostHog tracking - conditions not met'
      );
    });
  });

  describe('trackSignup() - Signup Event Tracking', () => {
    it('should track signup event with required properties', () => {
      const signupEvent: SignupEvent = {
        user_id: 'test-user',
        signup_method: 'email'
      };

      trackSignup(signupEvent);

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.SIGNUP,
        expect.objectContaining({
          user_id: 'test-user',
          signup_method: 'email'
        })
      );
    });

    it('should track signup event with optional properties', () => {
      const signupEvent: SignupEvent = {
        user_id: 'test-user',
        signup_method: 'email',
        referrer: 'google',
        experiment_variants: ['variant_a', 'variant_b']
      };

      trackSignup(signupEvent);

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.SIGNUP,
        expect.objectContaining({
          user_id: 'test-user',
          signup_method: 'email',
          referrer: 'google',
          experiment_variants: ['variant_a', 'variant_b']
        })
      );
    });

    it('should handle signup tracking errors gracefully', () => {
      mockPostHog.capture.mockImplementation(() => {
        throw new Error('Signup tracking error');
      });

      const signupEvent: SignupEvent = {
        user_id: 'test-user',
        signup_method: 'email'
      };

      expect(() => trackSignup(signupEvent)).not.toThrow();
    });
  });

  describe('trackCheckinSubmitted() - Check-in Event Tracking', () => {
    it('should track check-in event with required properties', () => {
      const checkinEvent: CheckinSubmittedEvent = {
        user_id: 'test-user',
        mood_score: 7,
        symptom_flags: ['hopeful', 'anxious']
      };

      trackCheckinSubmitted(checkinEvent);

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.CHECKIN_SUBMITTED,
        expect.objectContaining({
          user_id: 'test-user',
          mood_score: 7,
          symptom_flags: ['hopeful', 'anxious']
        })
      );
    });

    it('should track check-in event with optional properties', () => {
      const checkinEvent: CheckinSubmittedEvent = {
        user_id: 'test-user',
        mood_score: 7,
        symptom_flags: ['hopeful'],
        cycle_day: 14,
        time_to_complete_ms: 45000
      };

      trackCheckinSubmitted(checkinEvent);

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.CHECKIN_SUBMITTED,
        expect.objectContaining({
          user_id: 'test-user',
          mood_score: 7,
          symptom_flags: ['hopeful'],
          cycle_day: 14,
          time_to_complete_ms: 45000
        })
      );
    });

    it('should handle check-in tracking errors gracefully', () => {
      mockPostHog.capture.mockImplementation(() => {
        throw new Error('Check-in tracking error');
      });

      const checkinEvent: CheckinSubmittedEvent = {
        user_id: 'test-user',
        mood_score: 7,
        symptom_flags: ['hopeful']
      };

      expect(() => trackCheckinSubmitted(checkinEvent)).not.toThrow();
    });
  });

  describe('trackInsightViewed() - Insight View Event Tracking', () => {
    it('should track insight viewed event with required properties', () => {
      const insightEvent: InsightViewedEvent = {
        user_id: 'test-user',
        insight_id: 'insight_123',
        insight_type: 'daily_insight'
      };

      trackInsightViewed(insightEvent);

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.INSIGHT_VIEWED,
        expect.objectContaining({
          user_id: 'test-user',
          insight_id: 'insight_123',
          insight_type: 'daily_insight'
        })
      );
    });

    it('should track insight viewed event with optional properties', () => {
      const insightEvent: InsightViewedEvent = {
        user_id: 'test-user',
        insight_id: 'insight_123',
        insight_type: 'daily_insight',
        dwell_ms: 5000,
        cta_clicked: true
      };

      trackInsightViewed(insightEvent);

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.INSIGHT_VIEWED,
        expect.objectContaining({
          user_id: 'test-user',
          insight_id: 'insight_123',
          insight_type: 'daily_insight',
          dwell_ms: 5000,
          cta_clicked: true
        })
      );
    });

    it('should handle insight viewed tracking errors gracefully', () => {
      mockPostHog.capture.mockImplementation(() => {
        throw new Error('Insight viewed tracking error');
      });

      const insightEvent: InsightViewedEvent = {
        user_id: 'test-user',
        insight_id: 'insight_123',
        insight_type: 'daily_insight'
      };

      expect(() => trackInsightViewed(insightEvent)).not.toThrow();
    });
  });

  describe('trackShareAction() - Share Action Event Tracking', () => {
    it('should track share action event with required properties', () => {
      const shareEvent: ShareActionEvent = {
        user_id: 'test-user',
        share_surface: 'insight',
        destination: 'whatsapp'
      };

      trackShareAction(shareEvent);

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.SHARE_ACTION,
        expect.objectContaining({
          user_id: 'test-user',
          share_surface: 'insight',
          destination: 'whatsapp'
        })
      );
    });

    it('should track share action event with optional properties', () => {
      const shareEvent: ShareActionEvent = {
        user_id: 'test-user',
        share_surface: 'insight',
        destination: 'whatsapp',
        content_id: 'insight_123'
      };

      trackShareAction(shareEvent);

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.SHARE_ACTION,
        expect.objectContaining({
          user_id: 'test-user',
          share_surface: 'insight',
          destination: 'whatsapp',
          content_id: 'insight_123'
        })
      );
    });

    it('should handle share action tracking errors gracefully', () => {
      mockPostHog.capture.mockImplementation(() => {
        throw new Error('Share action tracking error');
      });

      const shareEvent: ShareActionEvent = {
        user_id: 'test-user',
        share_surface: 'insight',
        destination: 'whatsapp'
      };

      expect(() => trackShareAction(shareEvent)).not.toThrow();
    });
  });

  describe('identifyUser() - User Identification', () => {
    it('should identify user successfully', () => {
      const userId = 'test-user';
      const userProperties = { email: 'test@example.com', plan: 'premium' };

      identifyUser(userId, userProperties);

      expect(mockPostHog.identify).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          email: 'test@example.com',
          plan: 'premium',
          vercel_environment: 'test',
          deployment_type: 'vercel'
        })
      );
    });

    it('should identify user without properties', () => {
      const userId = 'test-user';

      identifyUser(userId);

      expect(mockPostHog.identify).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          vercel_environment: 'test',
          deployment_type: 'vercel'
        })
      );
    });

    it('should handle identification errors gracefully', () => {
      mockPostHog.identify.mockImplementation(() => {
        throw new Error('Identification error');
      });

      const userId = 'test-user';

      expect(() => identifyUser(userId)).not.toThrow();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Failed to identify user:',
        expect.any(Error)
      );
    });

    it('should handle missing PostHog gracefully', () => {
      (window as any).posthog = undefined;

      const userId = 'test-user';

      expect(() => identifyUser(userId)).not.toThrow();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '⚠️ PostHog not available for user identification'
      );
    });
  });

  describe('resetUser() - User Reset', () => {
    it('should reset user successfully', () => {
      resetUser();

      expect(mockPostHog.reset).toHaveBeenCalled();
    });

    it('should handle reset errors gracefully', () => {
      mockPostHog.reset.mockImplementation(() => {
        throw new Error('Reset error');
      });

      expect(() => resetUser()).not.toThrow();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Failed to reset PostHog:',
        expect.any(Error)
      );
    });

    it('should handle missing PostHog gracefully', () => {
      (window as any).posthog = undefined;

      expect(() => resetUser()).not.toThrow();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '⚠️ PostHog not available for reset'
      );
    });
  });

  describe('isAnalyticsEnabled() - Analytics Status', () => {
    it('should return true when API key is present', () => {
      vi.stubEnv('VITE_POSTHOG_API_KEY', 'test-key');
      expect(isAnalyticsEnabled()).toBe(true);
    });

    it('should return false when API key is missing', () => {
      vi.stubEnv('VITE_POSTHOG_API_KEY', '');
      expect(isAnalyticsEnabled()).toBe(false);
    });

    it('should return false when API key is undefined', () => {
      vi.stubEnv('VITE_POSTHOG_API_KEY', undefined);
      expect(isAnalyticsEnabled()).toBe(false);
    });
  });

  describe('initializeAnalytics() - Analytics Initialization', () => {
    it('should initialize analytics successfully', () => {
      expect(() => initializeAnalytics()).not.toThrow();
    });

    it('should handle initialization errors gracefully', () => {
      // Mock posthog initialization to throw error
      const originalPostHog = (window as any).posthog;
      (window as any).posthog = undefined;

      expect(() => initializeAnalytics()).not.toThrow();

      // Restore
      (window as any).posthog = originalPostHog;
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed payload gracefully', () => {
      const eventName = 'test_event';
      const payload = { user_id: null, invalid: undefined };

      expect(() => track(eventName, payload)).not.toThrow();
    });

    it('should handle very large payloads', () => {
      const eventName = 'test_event';
      const largePayload = {
        user_id: 'test-user',
        large_data: 'x'.repeat(10000)
      };

      expect(() => track(eventName, largePayload)).not.toThrow();
    });

    it('should handle special characters in payload', () => {
      const eventName = 'test_event';
      const payload = {
        user_id: 'test-user',
        special_chars: '🎉🚀💻📊',
        unicode: 'café résumé naïve'
      };

      expect(() => track(eventName, payload)).not.toThrow();
    });

    it('should handle concurrent tracking calls', () => {
      const eventName = 'test_event';
      const payload = { user_id: 'test-user' };

      // Simulate concurrent calls
      const promises = Array.from({ length: 10 }, () => 
        Promise.resolve(track(eventName, payload))
      );

      expect(() => Promise.all(promises)).not.toThrow();
    });
  });

  describe('Performance and Timing', () => {
    it('should track events within 200ms requirement', () => {
      const startTime = performance.now();
      
      track('test_event', { user_id: 'test-user' });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200);
    });

    it('should not block UI thread during tracking', () => {
      const eventName = 'test_event';
      const payload = { user_id: 'test-user' };

      // This should execute quickly without blocking
      const startTime = Date.now();
      track(eventName, payload);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });
  });
}); 