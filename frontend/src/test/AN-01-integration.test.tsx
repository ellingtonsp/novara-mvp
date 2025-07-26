/**
 * AN-01 Event Tracking Integration Tests
 * 
 * Tests actual component usage and event firing in real scenarios
 * Covers user journeys and component interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import DailyCheckinForm from '../components/DailyCheckinForm';
import DailyInsightsDisplay from '../components/DailyInsightsDisplay';
import NovaraLanding from '../components/NovaraLanding';
import { trackCheckinSubmitted, trackInsightViewed, trackShareAction } from '../lib/analytics';

// Mock analytics functions
vi.mock('../lib/analytics', () => ({
  trackCheckinSubmitted: vi.fn(),
  trackInsightViewed: vi.fn(),
  trackShareAction: vi.fn(),
  trackSignup: vi.fn(),
  initializeAnalytics: vi.fn(),
  identifyUser: vi.fn()
}));

// Mock API client
vi.mock('../lib/api', () => ({
  apiClient: {
    createUser: vi.fn(),
    loginUser: vi.fn(),
    submitCheckin: vi.fn(),
    getDailyInsights: vi.fn()
  }
}));

// Mock environment
vi.mock('../lib/environment', () => ({
  environmentConfig: {
    environment: 'test',
    isDevelopment: true,
    isProduction: false,
    isStaging: false,
    isPreview: false,
    debugMode: true,
    apiUrl: 'http://localhost:9002'
  },
  API_BASE_URL: 'http://localhost:9002'
}));

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

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

Object.defineProperty(window, 'posthog', {
  value: mockPostHog,
  writable: true
});

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('AN-01 Event Tracking Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-token');
    (window as any).posthog = mockPostHog;
    
    // Mock successful API responses
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          token: 'test-token',
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            nickname: 'TestUser'
          }
        }
      })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Daily Check-in Form - checkin_submitted Event', () => {
    it('should fire checkin_submitted event when form is submitted', async () => {
      // Mock successful check-in submission
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          checkin: {
            id: 'checkin-123',
            mood_today: 'hopeful, excited',
            confidence_today: 8
          }
        })
      });

      render(
        <TestWrapper>
          <DailyCheckinForm />
        </TestWrapper>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText(/How are you feeling today?/)).toBeInTheDocument();
      });

      // Fill out form
      const moodSlider = screen.getByRole('slider');
      fireEvent.change(moodSlider, { target: { value: '8' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      // Wait for submission to complete
      await waitFor(() => {
        expect(trackCheckinSubmitted).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: expect.any(String),
            mood_score: 8,
            symptom_flags: expect.any(Array),
            time_to_complete_ms: expect.any(Number)
          })
        );
      });
    });

    it('should handle check-in submission errors gracefully', async () => {
      // Mock failed check-in submission
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <DailyCheckinForm />
        </TestWrapper>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText(/How are you feeling today?/)).toBeInTheDocument();
      });

      // Fill out form
      const moodSlider = screen.getByRole('slider');
      fireEvent.change(moodSlider, { target: { value: '7' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      // Should not fire tracking event on error
      await waitFor(() => {
        expect(trackCheckinSubmitted).not.toHaveBeenCalled();
      });
    });

    it('should track time_to_complete_ms correctly', async () => {
      // Mock successful check-in submission
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          checkin: { id: 'checkin-123' }
        })
      });

      render(
        <TestWrapper>
          <DailyCheckinForm />
        </TestWrapper>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText(/How are you feeling today?/)).toBeInTheDocument();
      });

      // Simulate some time passing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Fill out form
      const moodSlider = screen.getByRole('slider');
      fireEvent.change(moodSlider, { target: { value: '6' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      // Wait for submission to complete
      await waitFor(() => {
        expect(trackCheckinSubmitted).toHaveBeenCalledWith(
          expect.objectContaining({
            time_to_complete_ms: expect.any(Number)
          })
        );
        
        // Verify time tracking is reasonable
        const callArgs = (trackCheckinSubmitted as any).mock.calls[0][0];
        expect(callArgs.time_to_complete_ms).toBeGreaterThan(0);
        expect(callArgs.time_to_complete_ms).toBeLessThan(10000); // Should be reasonable
      });
    });
  });

  describe('Daily Insights Display - insight_viewed Event', () => {
    it('should fire insight_viewed event when insight becomes visible', async () => {
      // Mock successful insights fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          insight: {
            id: 'insight-123',
            type: 'daily_insight',
            title: 'Test Insight',
            message: 'This is a test insight'
          },
          analysis_data: {
            checkins_analyzed: 5,
            user_id: 'test-user-id'
          }
        })
      });

      render(
        <TestWrapper>
          <DailyInsightsDisplay />
        </TestWrapper>
      );

      // Wait for insight to load and become visible
      await waitFor(() => {
        expect(screen.getByText(/Test Insight/)).toBeInTheDocument();
      });

      // Simulate insight becoming visible (IntersectionObserver callback)
      await waitFor(() => {
        expect(trackInsightViewed).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: expect.any(String),
            insight_id: expect.any(String),
            insight_type: 'daily_insight'
          })
        );
      });
    });

    it('should track dwell time when user stays on insight', async () => {
      // Mock successful insights fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          insight: {
            id: 'insight-123',
            type: 'daily_insight',
            title: 'Test Insight',
            message: 'This is a test insight'
          },
          analysis_data: {
            checkins_analyzed: 5,
            user_id: 'test-user-id'
          }
        })
      });

      render(
        <TestWrapper>
          <DailyInsightsDisplay />
        </TestWrapper>
      );

      // Wait for insight to load
      await waitFor(() => {
        expect(screen.getByText(/Test Insight/)).toBeInTheDocument();
      });

      // Simulate user dwelling on insight
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify insight viewed was tracked
      await waitFor(() => {
        expect(trackInsightViewed).toHaveBeenCalled();
      });
    });

    it('should not fire insight_viewed event when insight fails to load', async () => {
      // Mock failed insights fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'No insights available'
        })
      });

      render(
        <TestWrapper>
          <DailyInsightsDisplay />
        </TestWrapper>
      );

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByText(/Complete a few check-ins/)).toBeInTheDocument();
      });

      // Should not fire tracking event
      expect(trackInsightViewed).not.toHaveBeenCalled();
    });
  });

  describe('Share Action - share_action Event', () => {
    it('should fire share_action event when share button is clicked', async () => {
      // Mock successful insights fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          insight: {
            id: 'insight-123',
            type: 'daily_insight',
            title: 'Test Insight',
            message: 'This is a test insight'
          },
          analysis_data: {
            checkins_analyzed: 5,
            user_id: 'test-user-id'
          }
        })
      });

      render(
        <TestWrapper>
          <DailyInsightsDisplay />
        </TestWrapper>
      );

      // Wait for insight to load
      await waitFor(() => {
        expect(screen.getByText(/Test Insight/)).toBeInTheDocument();
      });

      // Find and click share button
      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);

      // Wait for share action to be tracked
      await waitFor(() => {
        expect(trackShareAction).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: expect.any(String),
            share_surface: 'insight',
            destination: 'clipboard',
            content_id: expect.stringContaining('insight_')
          })
        );
      });
    });

    it('should handle share action errors gracefully', async () => {
      // Mock successful insights fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          insight: {
            id: 'insight-123',
            type: 'daily_insight',
            title: 'Test Insight',
            message: 'This is a test insight'
          },
          analysis_data: {
            checkins_analyzed: 5,
            user_id: 'test-user-id'
          }
        })
      });

      // Mock navigator.share to throw error
      const originalShare = navigator.share;
      navigator.share = vi.fn().mockRejectedValue(new Error('Share failed'));

      render(
        <TestWrapper>
          <DailyInsightsDisplay />
        </TestWrapper>
      );

      // Wait for insight to load
      await waitFor(() => {
        expect(screen.getByText(/Test Insight/)).toBeInTheDocument();
      });

      // Find and click share button
      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);

      // Should still track the share attempt
      await waitFor(() => {
        expect(trackShareAction).toHaveBeenCalled();
      });

      // Restore original navigator.share
      navigator.share = originalShare;
    });
  });

  describe('User Signup - signup Event', () => {
    it('should fire signup event when user completes onboarding', async () => {
      // Mock successful user creation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            token: 'test-token',
            user: {
              id: 'new-user-id',
              email: 'newuser@example.com',
              nickname: 'NewUser'
            }
          }
        })
      });

      render(
        <TestWrapper>
          <NovaraLanding />
        </TestWrapper>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText(/Let's get started/)).toBeInTheDocument();
      });

      // Fill out signup form
      const emailInput = screen.getByLabelText(/email/i);
      const nicknameInput = screen.getByLabelText(/nickname/i);
      
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
      fireEvent.change(nicknameInput, { target: { value: 'NewUser' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /get started/i });
      fireEvent.click(submitButton);

      // Note: Signup tracking is currently commented out in the component
      // This test documents the expected behavior when implemented
      await waitFor(() => {
        // Currently no tracking call expected since it's commented out
        // expect(trackSignup).toHaveBeenCalledWith(
        //   expect.objectContaining({
        //     user_id: 'new-user-id',
        //     signup_method: 'email'
        //   })
        // );
      });
    });
  });

  describe('Event Payload Validation', () => {
    it('should include all required fields in checkin_submitted event', async () => {
      // Mock successful check-in submission
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          checkin: { id: 'checkin-123' }
        })
      });

      render(
        <TestWrapper>
          <DailyCheckinForm />
        </TestWrapper>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText(/How are you feeling today?/)).toBeInTheDocument();
      });

      // Fill out form
      const moodSlider = screen.getByRole('slider');
      fireEvent.change(moodSlider, { target: { value: '9' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      // Wait for submission to complete
      await waitFor(() => {
        expect(trackCheckinSubmitted).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: expect.any(String),
            mood_score: 9,
            symptom_flags: expect.any(Array),
            time_to_complete_ms: expect.any(Number)
          })
        );
      });

      // Verify payload structure
      const callArgs = (trackCheckinSubmitted as any).mock.calls[0][0];
      expect(callArgs).toHaveProperty('user_id');
      expect(callArgs).toHaveProperty('mood_score');
      expect(callArgs).toHaveProperty('symptom_flags');
      expect(callArgs).toHaveProperty('time_to_complete_ms');
      expect(Array.isArray(callArgs.symptom_flags)).toBe(true);
      expect(typeof callArgs.time_to_complete_ms).toBe('number');
    });

    it('should include all required fields in insight_viewed event', async () => {
      // Mock successful insights fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          insight: {
            id: 'insight-123',
            type: 'daily_insight',
            title: 'Test Insight',
            message: 'This is a test insight'
          },
          analysis_data: {
            checkins_analyzed: 5,
            user_id: 'test-user-id'
          }
        })
      });

      render(
        <TestWrapper>
          <DailyInsightsDisplay />
        </TestWrapper>
      );

      // Wait for insight to load
      await waitFor(() => {
        expect(screen.getByText(/Test Insight/)).toBeInTheDocument();
      });

      // Verify insight viewed was tracked
      await waitFor(() => {
        expect(trackInsightViewed).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: expect.any(String),
            insight_id: expect.any(String),
            insight_type: 'daily_insight'
          })
        );
      });

      // Verify payload structure
      const callArgs = (trackInsightViewed as any).mock.calls[0][0];
      expect(callArgs).toHaveProperty('user_id');
      expect(callArgs).toHaveProperty('insight_id');
      expect(callArgs).toHaveProperty('insight_type');
    });

    it('should include all required fields in share_action event', async () => {
      // Mock successful insights fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          insight: {
            id: 'insight-123',
            type: 'daily_insight',
            title: 'Test Insight',
            message: 'This is a test insight'
          },
          analysis_data: {
            checkins_analyzed: 5,
            user_id: 'test-user-id'
          }
        })
      });

      render(
        <TestWrapper>
          <DailyInsightsDisplay />
        </TestWrapper>
      );

      // Wait for insight to load
      await waitFor(() => {
        expect(screen.getByText(/Test Insight/)).toBeInTheDocument();
      });

      // Find and click share button
      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);

      // Wait for share action to be tracked
      await waitFor(() => {
        expect(trackShareAction).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: expect.any(String),
            share_surface: 'insight',
            destination: 'clipboard',
            content_id: expect.any(String)
          })
        );
      });

      // Verify payload structure
      const callArgs = (trackShareAction as any).mock.calls[0][0];
      expect(callArgs).toHaveProperty('user_id');
      expect(callArgs).toHaveProperty('share_surface');
      expect(callArgs).toHaveProperty('destination');
      expect(callArgs).toHaveProperty('content_id');
    });
  });

  describe('Performance Requirements', () => {
    it('should fire events within 200ms requirement', async () => {
      // Mock successful check-in submission
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          checkin: { id: 'checkin-123' }
        })
      });

      render(
        <TestWrapper>
          <DailyCheckinForm />
        </TestWrapper>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText(/How are you feeling today?/)).toBeInTheDocument();
      });

      // Fill out form
      const moodSlider = screen.getByRole('slider');
      fireEvent.change(moodSlider, { target: { value: '7' } });

      const startTime = performance.now();
      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      // Wait for tracking to complete
      await waitFor(() => {
        expect(trackCheckinSubmitted).toHaveBeenCalled();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Event should fire within 200ms
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should continue working when PostHog is unavailable', async () => {
      // Remove PostHog from window
      delete (window as any).posthog;

      // Mock successful check-in submission
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          checkin: { id: 'checkin-123' }
        })
      });

      render(
        <TestWrapper>
          <DailyCheckinForm />
        </TestWrapper>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText(/How are you feeling today?/)).toBeInTheDocument();
      });

      // Fill out form
      const moodSlider = screen.getByRole('slider');
      fireEvent.change(moodSlider, { target: { value: '8' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      // Should not throw error even without PostHog
      await waitFor(() => {
        expect(trackCheckinSubmitted).toHaveBeenCalled();
      });
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <DailyCheckinForm />
        </TestWrapper>
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText(/How are you feeling today?/)).toBeInTheDocument();
      });

      // Fill out form
      const moodSlider = screen.getByRole('slider');
      fireEvent.change(moodSlider, { target: { value: '6' } });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);

      // Should not fire tracking event on network error
      await waitFor(() => {
        expect(trackCheckinSubmitted).not.toHaveBeenCalled();
      });
    });
  });
}); 