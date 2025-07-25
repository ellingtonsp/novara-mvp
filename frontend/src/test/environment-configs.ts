// Environment-specific test configurations for Novara MVP frontend tests

export interface EnvironmentConfig {
  name: string;
  apiUrl: string;
  frontendUrl: string;
  environment: string;
  debug: boolean;
  timeout: number;
  testUser?: {
    email: string;
    password?: string;
  };
}

// Development environment configuration
export const developmentConfig: EnvironmentConfig = {
  name: 'Development',
  apiUrl: 'http://localhost:9002',
  frontendUrl: 'http://localhost:4200',
  environment: 'development',
  debug: true,
  timeout: 5000,
  testUser: {
    email: 'test@novara.dev',
  },
};

// Staging environment configuration
export const stagingConfig: EnvironmentConfig = {
  name: 'Staging',
  apiUrl: 'https://novara-staging-staging.up.railway.app',
  frontendUrl: 'https://novara-bd6xsx1ru-novara-fertility.vercel.app',
  environment: 'staging',
  debug: true,
  timeout: 10000,
  testUser: {
    email: 'test@novara.staging',
  },
};

// Production environment configuration
export const productionConfig: EnvironmentConfig = {
  name: 'Production',
  apiUrl: 'https://novara-mvp-production.up.railway.app',
  frontendUrl: 'https://novara-mvp.vercel.app',
  environment: 'production',
  debug: false,
  timeout: 15000,
  testUser: {
    email: 'test@novara.prod',
  },
};

// Get environment configuration based on current environment
export function getEnvironmentConfig(): EnvironmentConfig {
  const env = process.env.VITE_ENV || process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'staging':
      return stagingConfig;
    case 'production':
      return productionConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

// Test utilities for environment-specific testing
export class EnvironmentTestUtils {
  private config: EnvironmentConfig;

  constructor(config?: EnvironmentConfig) {
    this.config = config || getEnvironmentConfig();
  }

  // Test API connectivity
  async testApiConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });
      
      return response.ok;
    } catch (error) {
      console.error(`API connectivity test failed for ${this.config.name}:`, error);
      return false;
    }
  }

  // Test frontend accessibility
  async testFrontendAccessibility(): Promise<boolean> {
    try {
      const response = await fetch(this.config.frontendUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout),
      });
      
      return response.ok;
    } catch (error) {
      console.error(`Frontend accessibility test failed for ${this.config.name}:`, error);
      return false;
    }
  }

  // Test frontend content
  async testFrontendContent(): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const response = await fetch(this.config.frontendUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout),
      });
      
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }
      
      const content = await response.text();
      
      // Check for React app content
      const hasReactContent = content.includes('You don\'t have to navigate');
      const hasHtmlStructure = content.includes('<!DOCTYPE html>');
      
      if (hasReactContent && hasHtmlStructure) {
        return { success: true, content };
      } else {
        return { 
          success: false, 
          error: 'Missing React app content or invalid HTML structure' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Test user authentication flow
  async testUserAuthentication(): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      // Test login with test user
      const loginResponse = await fetch(`${this.config.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.config.testUser?.email || 'test@novara.test',
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });
      
      if (!loginResponse.ok) {
        return { success: false, error: `Login failed: HTTP ${loginResponse.status}` };
      }
      
      const loginData = await loginResponse.json();
      
      if (loginData.success && loginData.token) {
        return { success: true, token: loginData.token };
      } else {
        return { success: false, error: 'Login response missing token' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Test protected API endpoints
  async testProtectedEndpoints(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Test user profile endpoint
      const profileResponse = await fetch(`${this.config.apiUrl}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });
      
      if (!profileResponse.ok) {
        return { success: false, error: `Profile endpoint failed: HTTP ${profileResponse.status}` };
      }
      
      const profileData = await profileResponse.json();
      
      if (profileData.success && profileData.user) {
        return { success: true };
      } else {
        return { success: false, error: 'Profile response missing user data' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Run comprehensive environment test
  async runComprehensiveTest(): Promise<{
    apiConnectivity: boolean;
    frontendAccessibility: boolean;
    frontendContent: boolean;
    authentication: boolean;
    protectedEndpoints: boolean;
    overall: boolean;
  }> {
    console.log(`🧪 Running comprehensive test for ${this.config.name} environment...`);
    
    const apiConnectivity = await this.testApiConnectivity();
    const frontendAccessibility = await this.testFrontendAccessibility();
    const frontendContent = (await this.testFrontendContent()).success;
    const authentication = (await this.testUserAuthentication()).success;
    
    let protectedEndpoints = false;
    if (authentication) {
      const authResult = await this.testUserAuthentication();
      if (authResult.success && authResult.token) {
        protectedEndpoints = (await this.testProtectedEndpoints(authResult.token)).success;
      }
    }
    
    const overall = apiConnectivity && frontendAccessibility && frontendContent && authentication && protectedEndpoints;
    
    return {
      apiConnectivity,
      frontendAccessibility,
      frontendContent,
      authentication,
      protectedEndpoints,
      overall,
    };
  }
}

// Export default configuration
export default getEnvironmentConfig(); 