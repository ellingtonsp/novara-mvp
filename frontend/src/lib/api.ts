// lib/api.ts - Centralized API client using environment configuration
import { API_BASE_URL, environmentConfig } from './environment';
import { trackSignup, identifyUser, trackCheckinSubmitted } from './analytics';

// Log API configuration in debug mode
if (environmentConfig.debugMode) {
  console.log('🔗 API Client Configuration:', {
    apiUrl: API_BASE_URL,
    environment: environmentConfig.environment
  });
}

// TypeScript interfaces
export interface User {
  id: string;
  email: string;
  nickname: string;
  confidence_meds: number;
  confidence_costs: number;
  confidence_overall: number;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CheckinData {
  mood_today: string;
  primary_concern_today?: string;
  confidence_today: number;
  user_note?: string;
}

export interface CheckinResponse {
  id: string;
  mood_today: string;
  confidence_today: number;
  date_submitted: string;
  created_at: string;
}

// Simple API client object - no class complexity
export const apiClient = {
  // Helper method for making requests
  async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      console.log(`Making API request to: ${API_BASE_URL}${endpoint}`); // Debug log
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('API Error:', data);
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`
        };
      }

      return {
        success: true,
        data: data,
        message: data.message
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: 'Network error - please check your connection'
      };
    }
  },

  // Authentication methods
  async createUser(userData: any): Promise<ApiResponse<LoginResponse>> {
    const response = await this.makeRequest<LoginResponse>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Track signup event if successful - AN-01 Event Tracking
    if (response.success && response.data) {
      try {
        // Identify user in PostHog FIRST
        identifyUser(response.data.user.id, {
          email: response.data.user.email,
          nickname: response.data.user.nickname,
          signup_date: response.data.user.created_at
        });

        // Then track the signup event
        trackSignup({
          user_id: response.data.user.id,
          signup_method: 'email',
          referrer: document.referrer || undefined
        });
      } catch (error) {
        console.error('Failed to track signup event:', error);
      }
    }

    return response;
  },

  async loginUser(email: string): Promise<ApiResponse<LoginResponse>> {
    return this.makeRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found'
      };
    }

    return this.makeRequest<{ user: User }>('/api/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Check-in methods
  async submitCheckin(checkinData: CheckinData): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found'
      };
    }

    console.log('Submitting checkin with data:', checkinData); // Debug log

    const startTime = Date.now();
    const response = await this.makeRequest<any>('/api/checkins', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(checkinData),
    });

    // Track check-in submission if successful - AN-01 Event Tracking
    if (response.success && response.data) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const timeToComplete = Date.now() - startTime;
        
        // Convert mood string to numeric score
        const moodScore = this.convertMoodToScore(checkinData.mood_today);
        
        // Extract symptom flags from primary concern
        const symptomFlags = checkinData.primary_concern_today ? [checkinData.primary_concern_today] : [];

        trackCheckinSubmitted({
          user_id: user.id,
          mood_score: moodScore,
          symptom_flags: symptomFlags,
          time_to_complete_ms: timeToComplete
        });
      } catch (error) {
        console.error('Failed to track check-in event:', error);
      }
    }

    return response;
  },

  // Helper method to convert mood string to numeric score
  convertMoodToScore(mood: string): number {
    const moodScores: Record<string, number> = {
      'excellent': 10,
      'great': 8,
      'good': 7,
      'okay': 5,
      'not_great': 3,
      'terrible': 1,
      // Handle comma-separated moods by taking the first one
      'hopeful': 8,
      'optimistic': 9,
      'frustrated': 3,
      'anxious': 2,
      'tired': 4,
      'excited': 9,
      'calm': 7,
      'overwhelmed': 2,
      'confident': 8,
      'uncertain': 4
    };
    
    // Handle comma-separated moods (e.g., "hopeful, frustrated")
    const firstMood = mood.split(',')[0].trim().toLowerCase();
    return moodScores[firstMood] || 5; // Default to neutral
  },

  async getRecentCheckins(limit: number = 7): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found'
      };
    }

    return this.makeRequest<any>(`/api/checkins?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }
};