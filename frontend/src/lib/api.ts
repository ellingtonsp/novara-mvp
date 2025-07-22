const API_BASE_URL = 'https://novara-mvp-production.up.railway.app/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('novara_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async createUser(userData: {
    email: string;
    nickname?: string;
    confidence_meds?: number;
    confidence_costs?: number;
    confidence_overall?: number;
    primary_need?: string;
    cycle_stage?: string;
    top_concern?: string;
    email_opt_in?: boolean;
  }) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async loginUser(email: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async submitCheckin(checkinData: {
    mood_today: string;
    primary_concern_today?: string;
    confidence_today: number;
    user_note?: string;
  }) {
    return this.request('/checkins', {
      method: 'POST',
      body: JSON.stringify(checkinData),
    });
  }

  async getUserCheckins(limit: number = 7) {
    return this.request(`/checkins?limit=${limit}`);
  }
}
// Updates to add to your lib/api.ts file

// Add these new methods to your existing apiClient object:

const apiClient = {
  // ... your existing methods ...

  // Get daily insights
  async getDailyInsights() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/insights/daily`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch insights');
    }

    return data;
  },

  // Track insight engagement
  async trackInsightEngagement(engagementData: {
    insight_type: string;
    action: 'viewed' | 'clicked' | 'dismissed' | 'refreshed';
    insight_id?: string;
  }) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/insights/engagement`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(engagementData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to track engagement');
    }

    return data;
  },

  // Get user's recent check-ins (enhanced version)
  async getRecentCheckins(limit: number = 7) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/checkins?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch check-ins');
    }

    return data;
  }
};

// TypeScript interfaces for the insight system
export interface Insight {
  type: string;
  title: string;
  message: string;
  confidence: number;
  priority?: number;
}

export interface AnalysisData {
  checkins_analyzed: number;
  date_range: string;
  user_id: string;
}

export interface InsightResponse {
  success: boolean;
  insight: Insight;
  analysis_data: AnalysisData;
}

export interface EngagementData {
  insight_type: string;
  action: 'viewed' | 'clicked' | 'dismissed' | 'refreshed';
  insight_id?: string;
}

export interface CheckinData {
  id: string;
  mood_today: string;
  primary_concern_today?: string;
  confidence_today: number;
  user_note?: string;
  date_submitted: string;
  created_at: string;
}

export interface CheckinsResponse {
  success: boolean;
  checkins: CheckinData[];
  count: number;
}

export { apiClient };

export const apiClient = new ApiClient();