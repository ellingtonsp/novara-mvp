import { SpeedTapDetector, isSpeedTapDetectionEnabled, getSpeedTapConfig } from './speedTapDetection';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

// Mock process.env
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  mockSessionStorage.clear();
});

afterAll(() => {
  process.env = originalEnv;
});

describe('SpeedTapDetector', () => {
  let detector: SpeedTapDetector;

  beforeEach(() => {
    detector = new SpeedTapDetector();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('recordTap', () => {
    it('should record a tap event', () => {
      const result = detector.recordTap('click', 1);
      expect(result).toBe(false); // Not enough taps yet
      expect(detector.getTapCount()).toBe(1);
    });

    it('should detect speed-tap with 3 taps in 10 seconds', () => {
      // First tap
      detector.recordTap('click', 1);
      expect(detector.getTapCount()).toBe(1);

      // Second tap after 3 seconds
      jest.advanceTimersByTime(3000);
      detector.recordTap('click', 1);
      expect(detector.getTapCount()).toBe(2);

      // Third tap after 6 seconds (total 9 seconds)
      jest.advanceTimersByTime(3000);
      const result = detector.recordTap('click', 2);
      expect(result).toBe(true); // Should trigger speed-tap
      expect(detector.getTapCount()).toBe(3);
    });

    it('should not detect speed-tap with 3 taps over 10 seconds', () => {
      // First tap
      detector.recordTap('click', 1);

      // Second tap after 5 seconds
      jest.advanceTimersByTime(5000);
      detector.recordTap('click', 1);

      // Third tap after 6 more seconds (total 11 seconds)
      jest.advanceTimersByTime(6000);
      const result = detector.recordTap('click', 2);
      expect(result).toBe(false); // Should not trigger speed-tap
      expect(detector.getTapCount()).toBe(1); // Only the last tap should remain
    });

    it('should not detect speed-tap after reaching max step', () => {
      // Add taps to reach step 3
      detector.recordTap('click', 3);
      detector.recordTap('click', 3);
      detector.recordTap('click', 3);

      const result = detector.recordTap('click', 3);
      expect(result).toBe(false); // Should not trigger after step 3
    });

    it('should clean up old taps outside time window', () => {
      // Add taps over time
      detector.recordTap('click', 1);
      jest.advanceTimersByTime(5000);
      detector.recordTap('click', 1);
      jest.advanceTimersByTime(5000);
      detector.recordTap('click', 1);

      // Should only have 1 tap after cleanup
      expect(detector.getTapCount()).toBe(1);
    });
  });

  describe('configuration', () => {
    it('should use custom configuration', () => {
      const customDetector = new SpeedTapDetector({
        timeWindowMs: 5000,
        tapThreshold: 2,
        maxStep: 2
      });

      // Should trigger with 2 taps in 5 seconds
      customDetector.recordTap('click', 1);
      jest.advanceTimersByTime(2000);
      const result = customDetector.recordTap('click', 1);
      expect(result).toBe(true);
    });

    it('should get correct time window', () => {
      expect(detector.getTimeWindowMs()).toBe(10000);
    });
  });

  describe('session storage', () => {
    it('should save and load tap history', () => {
      detector.recordTap('click', 1);
      detector.recordTap('click', 2);

      // Create new detector instance
      const newDetector = new SpeedTapDetector();
      expect(newDetector.getTapCount()).toBe(2);
    });

    it('should handle session storage errors gracefully', () => {
      // Mock sessionStorage.setItem to throw error
      mockSessionStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      // Should not crash
      expect(() => detector.recordTap('click', 1)).not.toThrow();
    });
  });

  describe('clearHistory', () => {
    it('should clear tap history', () => {
      detector.recordTap('click', 1);
      detector.recordTap('click', 2);
      expect(detector.getTapCount()).toBe(2);

      detector.clearHistory();
      expect(detector.getTapCount()).toBe(0);
    });
  });
});

describe('isSpeedTapDetectionEnabled', () => {
  it('should return true when environment variable is set', () => {
    process.env.REACT_APP_SPEED_TAP_ENABLED = 'true';
    expect(isSpeedTapDetectionEnabled()).toBe(true);
  });

  it('should return false when environment variable is not set', () => {
    delete process.env.REACT_APP_SPEED_TAP_ENABLED;
    expect(isSpeedTapDetectionEnabled()).toBe(false);
  });

  it('should return true when localStorage flag is set', () => {
    localStorage.setItem('speed_tap_detection_enabled', 'true');
    expect(isSpeedTapDetectionEnabled()).toBe(true);
  });
});

describe('getSpeedTapConfig', () => {
  it('should return default config when no environment variable', () => {
    delete process.env.REACT_APP_SPEED_TAP_CONFIG;
    const config = getSpeedTapConfig();
    expect(config).toEqual({
      timeWindowMs: 10000,
      tapThreshold: 3,
      maxStep: 3,
      rollingWindow: true
    });
  });

  it('should parse environment config', () => {
    process.env.REACT_APP_SPEED_TAP_CONFIG = JSON.stringify({
      timeWindowMs: 5000,
      tapThreshold: 2
    });
    const config = getSpeedTapConfig();
    expect(config).toEqual({
      timeWindowMs: 5000,
      tapThreshold: 2,
      maxStep: 3,
      rollingWindow: true
    });
  });

  it('should handle invalid JSON gracefully', () => {
    process.env.REACT_APP_SPEED_TAP_CONFIG = 'invalid json';
    const config = getSpeedTapConfig();
    expect(config).toEqual({
      timeWindowMs: 10000,
      tapThreshold: 3,
      maxStep: 3,
      rollingWindow: true
    });
  });
});

describe('Edge Cases', () => {
  let detector: SpeedTapDetector;

  beforeEach(() => {
    detector = new SpeedTapDetector();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should handle rapid successive taps', () => {
    detector.recordTap('click', 1);
    detector.recordTap('click', 1);
    detector.recordTap('click', 1);

    const result = detector.recordTap('click', 1);
    expect(result).toBe(true);
  });

  it('should handle different event types', () => {
    detector.recordTap('focus', 1);
    detector.recordTap('change', 1);
    detector.recordTap('blur', 1);

    const result = detector.recordTap('click', 1);
    expect(result).toBe(true);
  });

  it('should handle step progression', () => {
    detector.recordTap('click', 1);
    detector.recordTap('click', 2);
    detector.recordTap('click', 3);

    const result = detector.recordTap('click', 3);
    expect(result).toBe(false); // Should not trigger after step 3
  });
}); 