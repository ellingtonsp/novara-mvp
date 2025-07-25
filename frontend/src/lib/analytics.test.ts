// Analytics Service Unit Tests - AN-01 Event Tracking
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  track, 
  trackSignup, 
  trackCheckinSubmitted, 
  trackInsightViewed, 
  trackShareAction,
  ANALYTICS_EVENTS,
  initializeAnalytics,
  isAnalyticsEnabled
} from './analytics';

// Mock PostHog
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn()
  }
}));

// Mock environment
vi.mock('./environment', () => ({
  environmentConfig: {
    environment: 'test',
    isDevelopment: true,
    isStaging: false,
    isProduction: false,
    debugMode: true
  }
}));

describe('Analytics Service - AN-01 Event Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Event Constants', () => {
    it('should have correct event names', () => {
      expect(ANALYTICS_EVENTS.SIGNUP).toBe('signup');
      expect(ANALYTICS_EVENTS.CHECKIN_SUBMITTED).toBe('checkin_submitted');
      expect(ANALYTICS_EVENTS.INSIGHT_VIEWED).toBe('insight_viewed');
      expect(ANALYTICS_EVENTS.SHARE_ACTION).toBe('share_action');
    });
  });

  describe('Core Tracking Function', () => {
    it('should log events in development mode', () => {
      const mockPayload = { user_id: 'test123', test: 'data' };
      
      track('test_event', mockPayload);
      
      expect(console.debug).toHaveBeenCalledWith(
        '📊 PH-DEV Event:',
        'test_event',
        expect.objectContaining({
          ...mockPayload,
          environment: 'test',
          timestamp: expect.any(String)
        })
      );
    });

    it('should handle errors gracefully', () => {
      const mockPayload = { user_id: 'test123' };
      
      // Mock console.debug to throw
      vi.spyOn(console, 'debug').mockImplementation(() => {
        throw new Error('Test error');
      });
      
      // Should not throw even if console.debug fails
      expect(() => track('test_event', mockPayload)).not.toThrow();
    });
  });

  describe('Signup Event Tracking', () => {
    it('should track signup with correct payload', () => {
      const signupPayload = {
        user_id: 'u_123',
        signup_method: 'email',
        referrer: 'google.com'
      };
      
      trackSignup(signupPayload);
      
      expect(console.debug).toHaveBeenCalledWith(
        '📊 PH-DEV Event:',
        'signup',
        expect.objectContaining({
          ...signupPayload,
          environment: 'test',
          timestamp: expect.any(String)
        })
      );
    });

    it('should handle missing optional fields', () => {
      const signupPayload = {
        user_id: 'u_123',
        signup_method: 'email'
      };
      
      trackSignup(signupPayload);
      
      expect(console.debug).toHaveBeenCalledWith(
        '📊 PH-DEV Event:',
        'signup',
        expect.objectContaining({
          user_id: 'u_123',
          signup_method: 'email',
          environment: 'test',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Check-in Event Tracking', () => {
    it('should track check-in with correct payload', () => {
      const checkinPayload = {
        user_id: 'u_123',
        mood_score: 7,
        symptom_flags: ['stress', 'fatigue'],
        time_to_complete_ms: 1500
      };
      
      trackCheckinSubmitted(checkinPayload);
      
      expect(console.debug).toHaveBeenCalledWith(
        '📊 PH-DEV Event:',
        'checkin_submitted',
        expect.objectContaining({
          ...checkinPayload,
          environment: 'test',
          timestamp: expect.any(String)
        })
      );
    });

    it('should handle empty symptom flags', () => {
      const checkinPayload = {
        user_id: 'u_123',
        mood_score: 5,
        symptom_flags: []
      };
      
      trackCheckinSubmitted(checkinPayload);
      
      expect(console.debug).toHaveBeenCalledWith(
        '📊 PH-DEV Event:',
        'checkin_submitted',
        expect.objectContaining({
          user_id: 'u_123',
          mood_score: 5,
          symptom_flags: [],
          environment: 'test',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Insight Event Tracking', () => {
    it('should track insight view with correct payload', () => {
      const insightPayload = {
        user_id: 'u_123',
        insight_id: 'insight_confidence_rising_123',
        insight_type: 'confidence_rising',
        dwell_ms: 5000
      };
      
      trackInsightViewed(insightPayload);
      
      expect(console.debug).toHaveBeenCalledWith(
        '📊 PH-DEV Event:',
        'insight_viewed',
        expect.objectContaining({
          ...insightPayload,
          environment: 'test',
          timestamp: expect.any(String)
        })
      );
    });

    it('should handle missing optional fields', () => {
      const insightPayload = {
        user_id: 'u_123',
        insight_id: 'insight_test_123',
        insight_type: 'test_type'
      };
      
      trackInsightViewed(insightPayload);
      
      expect(console.debug).toHaveBeenCalledWith(
        '📊 PH-DEV Event:',
        'insight_viewed',
        expect.objectContaining({
          user_id: 'u_123',
          insight_id: 'insight_test_123',
          insight_type: 'test_type',
          environment: 'test',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Share Event Tracking', () => {
    it('should track share action with correct payload', () => {
      const sharePayload = {
        user_id: 'u_123',
        share_surface: 'insight',
        destination: 'whatsapp',
        content_id: 'insight_123'
      };
      
      trackShareAction(sharePayload);
      
      expect(console.debug).toHaveBeenCalledWith(
        '📊 PH-DEV Event:',
        'share_action',
        expect.objectContaining({
          ...sharePayload,
          environment: 'test',
          timestamp: expect.any(String)
        })
      );
    });

    it('should handle missing optional content_id', () => {
      const sharePayload = {
        user_id: 'u_123',
        share_surface: 'checkin',
        destination: 'email'
      };
      
      trackShareAction(sharePayload);
      
      expect(console.debug).toHaveBeenCalledWith(
        '📊 PH-DEV Event:',
        'share_action',
        expect.objectContaining({
          user_id: 'u_123',
          share_surface: 'checkin',
          destination: 'email',
          environment: 'test',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Analytics Initialization', () => {
    it('should handle missing API key gracefully', () => {
      // Mock missing API key
      vi.stubEnv('VITE_POSTHOG_API_KEY', '');
      
      expect(() => initializeAnalytics()).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith(
        'PostHog API key not found. Analytics will be disabled.'
      );
    });

    it('should disable analytics in development mode', () => {
      vi.stubEnv('VITE_POSTHOG_API_KEY', 'test_key');
      
      initializeAnalytics();
      
      expect(console.log).toHaveBeenCalledWith(
        'PostHog disabled in development mode'
      );
    });
  });

  describe('Analytics Status', () => {
    it('should return correct enabled status', () => {
      // Test with missing API key
      vi.stubEnv('VITE_POSTHOG_API_KEY', '');
      expect(isAnalyticsEnabled()).toBe(false);
      
      // Test with API key but in development
      vi.stubEnv('VITE_POSTHOG_API_KEY', 'test_key');
      expect(isAnalyticsEnabled()).toBe(false);
    });
  });

  describe('Payload Validation', () => {
    it('should include required fields for signup', () => {
      const payload = {
        user_id: 'u_123',
        signup_method: 'email'
      };
      
      trackSignup(payload);
      
      const loggedPayload = vi.mocked(console.debug).mock.calls[0][2];
      expect(loggedPayload).toHaveProperty('user_id');
      expect(loggedPayload).toHaveProperty('signup_method');
      expect(loggedPayload).toHaveProperty('environment');
      expect(loggedPayload).toHaveProperty('timestamp');
    });

    it('should include required fields for check-in', () => {
      const payload = {
        user_id: 'u_123',
        mood_score: 7,
        symptom_flags: ['stress']
      };
      
      trackCheckinSubmitted(payload);
      
      const loggedPayload = vi.mocked(console.debug).mock.calls[0][2];
      expect(loggedPayload).toHaveProperty('user_id');
      expect(loggedPayload).toHaveProperty('mood_score');
      expect(loggedPayload).toHaveProperty('symptom_flags');
      expect(loggedPayload).toHaveProperty('environment');
      expect(loggedPayload).toHaveProperty('timestamp');
    });

    it('should include required fields for insight view', () => {
      const payload = {
        user_id: 'u_123',
        insight_id: 'insight_123',
        insight_type: 'confidence_rising'
      };
      
      trackInsightViewed(payload);
      
      const loggedPayload = vi.mocked(console.debug).mock.calls[0][2];
      expect(loggedPayload).toHaveProperty('user_id');
      expect(loggedPayload).toHaveProperty('insight_id');
      expect(loggedPayload).toHaveProperty('insight_type');
      expect(loggedPayload).toHaveProperty('environment');
      expect(loggedPayload).toHaveProperty('timestamp');
    });

    it('should include required fields for share action', () => {
      const payload = {
        user_id: 'u_123',
        share_surface: 'insight',
        destination: 'whatsapp'
      };
      
      trackShareAction(payload);
      
      const loggedPayload = vi.mocked(console.debug).mock.calls[0][2];
      expect(loggedPayload).toHaveProperty('user_id');
      expect(loggedPayload).toHaveProperty('share_surface');
      expect(loggedPayload).toHaveProperty('destination');
      expect(loggedPayload).toHaveProperty('environment');
      expect(loggedPayload).toHaveProperty('timestamp');
    });
  });
}); 