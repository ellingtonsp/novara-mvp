// lib/api-v2.ts - V2 API client with V1 fallback support
import { API_BASE_URL } from './environment';
import { CheckinData, CheckinResponse } from './api';

export interface Insight {
  type: string;
  title: string;
  message: string;
  icon: string;
  insight_id?: string;
}

export interface InsightResponse {
  success: boolean;
  insight: Insight;
}

export interface V2StatusResponse {
  success: boolean;
  status: {
    schema_v2_enabled: boolean;
    endpoints_available: string[];
  };
}

export interface DailySummary {
  date: string;
  user_id: string;
  check_in_completed: boolean;
  mood_score: number | null;
  confidence_score: number | null;
  medication_taken: string | null;
  events: HealthEvent[];
  insights: Insight[];
}

export interface HealthEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, any>;
  occurred_at: string;
  created_at: string;
}

export class ApiV2Client {
  private token: string | null = null;
  private useV2: boolean = false;

  constructor() {
    // Check if V2 is enabled via localStorage or env
    this.useV2 = localStorage.getItem('useV2Api') === 'true' || 
                 import.meta.env.VITE_USE_V2_API === 'true';
  }

  setToken(token: string | null) {
    this.token = token;
  }

  enableV2() {
    this.useV2 = true;
    localStorage.setItem('useV2Api', 'true');
  }

  disableV2() {
    this.useV2 = false;
    localStorage.removeItem('useV2Api');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Merge with any headers from options
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  // Health Summary - V2 only
  async getDailySummary(date?: string): Promise<DailySummary> {
    const params = date ? `?date=${date}` : '';
    const response = await this.makeRequest<{ success: boolean; summary: DailySummary }>(
      `/api/v2/health/daily-summary${params}`,
      { method: 'GET' }
    );
    return response.summary;
  }

  // Health Events - V2 only
  async createHealthEvent(eventData: {
    event_type: string;
    event_data: Record<string, any>;
    occurred_at?: string;
  }): Promise<HealthEvent> {
    const response = await this.makeRequest<{ success: boolean; event: HealthEvent }>(
      '/api/v2/health/events',
      {
        method: 'POST',
        body: JSON.stringify(eventData),
      }
    );
    return response.event;
  }

  // Check-ins with V2 enhancement
  async submitCheckin(data: CheckinData): Promise<CheckinResponse> {
    // Always use V1 for now since V2 check-in isn't ready
    const response = await this.makeRequest<{ success: boolean; checkin: CheckinResponse }>('/api/checkins', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // If V2 is enabled, also create a health event
    if (this.useV2) {
      try {
        await this.createHealthEvent({
          event_type: 'daily_checkin_completed',
          event_data: {
            mood: data.mood_today,
            confidence: data.confidence_today,
            note: data.user_note,
          },
        });
      } catch (error) {
        console.warn('Failed to create V2 health event:', error);
      }
    }

    return response.checkin;
  }

  // Get insights with V2 daily summary integration
  async getDailyInsights(): Promise<InsightResponse> {
    if (this.useV2) {
      try {
        // Try V2 first
        const summary = await this.getDailySummary();
        if (summary.insights && summary.insights.length > 0) {
          return {
            success: true,
            insight: summary.insights[0],
          };
        }
      } catch (error) {
        console.warn('V2 daily summary failed, falling back to V1:', error);
      }
    }

    // Fallback to V1
    return this.makeRequest('/api/insights/daily', { method: 'GET' });
  }

  // Check V2 availability
  async checkV2Status(): Promise<boolean> {
    try {
      const response = await this.makeRequest<V2StatusResponse>('/api/v2/status', { 
        method: 'GET' 
      });
      return response.status?.schema_v2_enabled === true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiV2 = new ApiV2Client();