// Health check utility to verify backend connectivity
import { API_BASE_URL } from './environment';

export interface HealthCheckResult {
  healthy: boolean;
  url: string;
  error?: string;
  details?: any;
}

export async function checkBackendHealth(): Promise<HealthCheckResult> {
  const healthUrl = `${API_BASE_URL}/api/health`;
  
  try {
    console.log('🏥 Checking backend health:', healthUrl);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is healthy:', data);
      
      return {
        healthy: true,
        url: API_BASE_URL,
        details: data
      };
    } else {
      console.error('❌ Backend health check failed:', response.status);
      return {
        healthy: false,
        url: API_BASE_URL,
        error: `Health check failed with status: ${response.status}`
      };
    }
  } catch (error) {
    console.error('❌ Backend health check error:', error);
    return {
      healthy: false,
      url: API_BASE_URL,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run health check on app initialization
export async function initializeHealthCheck(): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    const result = await checkBackendHealth();
    
    if (!result.healthy) {
      console.warn('⚠️ Backend health check failed during initialization');
      console.warn('⚠️ API URL:', result.url);
      console.warn('⚠️ Error:', result.error);
      console.warn('⚠️ Make sure the backend is running and accessible');
    }
  }
}