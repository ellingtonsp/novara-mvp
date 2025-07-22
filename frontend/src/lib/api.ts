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

export const apiClient = new ApiClient();