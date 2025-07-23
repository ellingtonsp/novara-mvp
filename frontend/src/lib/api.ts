// lib/api.ts - Simple direct fix with hardcoded Railway URL

// Always use Railway URL - no environment detection
const API_BASE_URL = 'https://novara-mvp-production.up.railway.app';

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
    return this.makeRequest<LoginResponse>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
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

    return this.makeRequest<any>('/api/checkins', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(checkinData),
    });
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