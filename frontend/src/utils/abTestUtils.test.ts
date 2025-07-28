import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getOnboardingPath, 
  generateSessionId, 
  getSessionId,
  clearOnboardingPathCache,
  OnboardingPath 
} from './abTestUtils-CLEAN';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

// Mock window object
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

// Mock PostHog
Object.defineProperty(window, 'posthog', {
  value: {
    isFeatureEnabled: vi.fn(),
    capture: vi.fn()
  },
  writable: true
});

// Mock environment variables
const originalEnv = import.meta.env;
Object.defineProperty(import.meta, 'env', {
  value: {
    ...originalEnv,
    VITE_FORCE_ONBOARDING_PATH: undefined,
    NODE_ENV: 'test'
  },
  writable: true
});

describe('ON-01 A/B Test Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearOnboardingPathCache();
  });

  describe('Session Management', () => {
    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      
      expect(id1).toMatch(/^session_\d+_[a-z0-9]{9}$/);
      expect(id2).toMatch(/^session_\d+_[a-z0-9]{9}$/);
      expect(id1).not.toBe(id2);
    });

    it('should return cached session ID if exists', () => {
      const cachedId = 'session_1234567890_abc123def';
      mockSessionStorage.getItem.mockReturnValue(cachedId);
      
      const result = getSessionId();
      
      expect(result).toBe(cachedId);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('novara_onboarding_session_id');
    });

    it('should generate and cache new session ID if none exists', () => {
      mockSessionStorage.getItem.mockReturnValue(null);
      
      const result = getSessionId();
      
      expect(result).toMatch(/^session_\d+_[a-z0-9]{9}$/);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('novara_onboarding_session_id', result);
    });
  });

  describe('A/B Test Path Assignment', () => {
    it('should return cached path if exists', () => {
      const sessionId = 'session_1234567890_abc123def';
      mockSessionStorage.getItem
        .mockReturnValueOnce(sessionId) // getSessionId
        .mockReturnValueOnce('test'); // cached path
      
      const result = getOnboardingPath();
      
      expect(result).toBe('test');
    });

    it('should use forced path from environment variable', () => {
      Object.defineProperty(import.meta, 'env', {
        value: {
          ...originalEnv,
          VITE_FORCE_ONBOARDING_PATH: 'control',
          NODE_ENV: 'test'
        },
        writable: true
      });

      mockSessionStorage.getItem.mockReturnValue('session_1234567890_abc123def');
      
      const result = getOnboardingPath();
      
      expect(result).toBe('control');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'novara_onboarding_path_session_1234567890_abc123def',
        'control'
      );
    });

    it('should use PostHog feature flag when available', () => {
      const mockPostHog = window.posthog as any;
      mockPostHog.isFeatureEnabled.mockReturnValue(true);
      
      mockSessionStorage.getItem.mockReturnValue('session_1234567890_abc123def');
      
      const result = getOnboardingPath();
      
      expect(result).toBe('test');
      expect(mockPostHog.isFeatureEnabled).toHaveBeenCalledWith('fast_onboarding_v1');
    });

    it('should fall back to deterministic split when PostHog not available', () => {
      // Mock PostHog as undefined
      Object.defineProperty(window, 'posthog', {
        value: undefined,
        writable: true
      });

      mockSessionStorage.getItem.mockReturnValue('session_1234567890_abc123def');
      
      const result = getOnboardingPath();
      
      // Should be deterministic based on session hash
      expect(['control', 'test']).toContain(result);
    });
  });

  describe('A/B Test Distribution Validation', () => {
    it('should maintain 50/50 distribution across many sessions', () => {
      const results: OnboardingPath[] = [];
      const numTests = 100; // Reduced for faster test execution
      
      for (let i = 0; i < numTests; i++) {
        // Generate unique session ID for each test
        const sessionId = `session_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
        mockSessionStorage.getItem.mockReturnValue(sessionId);
        
        const result = getOnboardingPath();
        results.push(result);
      }
      
      const controlCount = results.filter(r => r === 'control').length;
      const testCount = results.filter(r => r === 'test').length;
      
      // Should be roughly 50/50 (within 20% tolerance for smaller sample)
      const controlPercentage = (controlCount / numTests) * 100;
      const testPercentage = (testCount / numTests) * 100;
      
      expect(controlPercentage).toBeGreaterThan(30);
      expect(controlPercentage).toBeLessThan(70);
      expect(testPercentage).toBeGreaterThan(30);
      expect(testPercentage).toBeLessThan(70);
      
      console.log(`Distribution: Control ${controlPercentage.toFixed(1)}%, Test ${testPercentage.toFixed(1)}%`);
    });

    it('should maintain session consistency', () => {
      const sessionId = 'session_1234567890_abc123def';
      mockSessionStorage.getItem.mockReturnValue(sessionId);
      
      const results: OnboardingPath[] = [];
      
      // Test same session multiple times
      for (let i = 0; i < 10; i++) {
        const result = getOnboardingPath();
        results.push(result);
      }
      
      // All results should be the same for the same session
      const firstResult = results[0];
      const allSame = results.every(result => result === firstResult);
      
      expect(allSame).toBe(true);
      expect(['control', 'test']).toContain(firstResult);
    });

    it('should handle browser-like session generation', () => {
      const browserSessions = [];
      
      for (let i = 0; i < 20; i++) {
        // Simulate browser session ID generation
        const browserSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        mockSessionStorage.getItem.mockReturnValue(browserSessionId);
        
        const result = getOnboardingPath();
        browserSessions.push(result);
      }
      
      const browserTestCount = browserSessions.filter(path => path === 'test').length;
      const browserControlCount = browserSessions.filter(path => path === 'control').length;
      
      // Should have both test and control paths
      expect(browserTestCount).toBeGreaterThan(0);
      expect(browserControlCount).toBeGreaterThan(0);
      
      console.log(`Browser sessions - Test: ${browserTestCount}, Control: ${browserControlCount}`);
    });
  });

  describe('Cache Management', () => {
    it('should clear onboarding path cache', () => {
      const sessionId = 'session_1234567890_abc123def';
      mockSessionStorage.getItem.mockReturnValue(sessionId);
      
      clearOnboardingPathCache();
      
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'novara_onboarding_path_session_1234567890_abc123def'
      );
    });
  });

  describe('Environment Variable Testing', () => {
    it('should handle test path forcing', () => {
      Object.defineProperty(import.meta, 'env', {
        value: {
          ...originalEnv,
          VITE_FORCE_ONBOARDING_PATH: 'test',
          NODE_ENV: 'test'
        },
        writable: true
      });

      mockSessionStorage.getItem.mockReturnValue('session_1234567890_abc123def');
      
      const result = getOnboardingPath();
      
      expect(result).toBe('test');
    });

    it('should handle control path forcing', () => {
      Object.defineProperty(import.meta, 'env', {
        value: {
          ...originalEnv,
          VITE_FORCE_ONBOARDING_PATH: 'control',
          NODE_ENV: 'test'
        },
        writable: true
      });

      mockSessionStorage.getItem.mockReturnValue('session_1234567890_abc123def');
      
      const result = getOnboardingPath();
      
      expect(result).toBe('control');
    });
  });
}); 